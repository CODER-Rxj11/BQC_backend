import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { connect, getDb, close } from "../src/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, "..", "seed_assets");

/**
 * Initial client logos. Put a matching file in backend/seed_assets/ for each.
 * Missing files are skipped (with a warning) so the seed is safe to re-run as
 * you add logos. SVG preferred; PNG/JPG/WEBP with transparent bg also fine.
 */
const MANIFEST = [
  { name: "TVS", file: "tvs.png", order: 1 },
  { name: "Mahindra", file: "mahindra.png", order: 2 },
  { name: "Maruti Suzuki", file: "maruti.png", order: 3 },
  { name: "Hero", file: "hero.png", order: 4 },
  { name: "Bajaj", file: "bajaj.png", order: 5 },
  { name: "Ather", file: "ather.svg", order: 6 },
  { name: "Jio", file: "jio.png", order: 7 },
  { name: "Tata Tea", file: "tatatea.png", order: 8 },
  { name: "Gulf Oil", file: "gulf.png", order: 9 },
  { name: "Campa", file: "campa.png", order: 10 },
  { name: "Maaza", file: "maaza.png", order: 11 },
  { name: "Johnnie Walker", file: "jhonniewalker.png", order: 12 },
  { name: "MP Police", file: "mppolice.png", order: 13 },
  { name: "Apollo Sage Hospitals", file: "apollo.png", order: 14 },
  { name: "Macleods", file: "macleods.png", order: 15 },
  { name: "Vidyapeeth (PW)", file: "pw.png", order: 16 },
  { name: "Extra Marks", file: "extramarks.png", order: 17 },
  { name: "Toppr", file: "toppr.png", order: 18 },
  { name: "Aakash", file: "akash.png", order: 19 },
  { name: "Resonance", file: "reseonance.png", order: 20 },
  { name: "FirstCry", file: "firstcry.png", order: 21 },
  { name: "Solis", file: "solis.png", order: 22 },
];

const MIME = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

// Resolve a manifest entry to an actual file (allow any supported extension so
// you can drop solis.png instead of solis.svg without editing this file).
async function resolveFile(entry) {
  const base = entry.file.replace(/\.[^.]+$/, "");
  const candidates = [entry.file, ...Object.keys(MIME).map((ext) => base + ext)];
  for (const cand of candidates) {
    try {
      const full = path.join(ASSETS, cand);
      await fs.access(full);
      return { full, filename: cand };
    } catch {
      /* try next */
    }
  }
  return null;
}

async function run() {
  await connect();
  const { db, bucket } = getDb();

  let seeded = 0;
  let skipped = 0;

  for (const entry of MANIFEST) {
    const found = await resolveFile(entry);
    if (!found) {
      console.warn(`  ⚠ SKIP ${entry.name} — no file for "${entry.file}" in seed_assets/`);
      skipped++;
      continue;
    }

    const buf = await fs.readFile(found.full);
    const ext = path.extname(found.filename).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    const hash = crypto.createHash("sha256").update(buf).digest("hex");

    const existing = await db.collection("clients").findOne({ name: entry.name });
    if (existing && existing.hash === hash) {
      console.log(`  = ${entry.name} unchanged`);
      continue;
    }
    if (existing) {
      try {
        await bucket.delete(existing.fileId);
      } catch {
        /* ignore */
      }
    }

    const fileId = await new Promise((resolve, reject) => {
      const s = bucket.openUploadStream(found.filename, {
        contentType,
        metadata: { name: entry.name, hash },
      });
      s.on("error", reject);
      s.on("finish", () => resolve(s.id));
      s.end(buf);
    });

    const doc = {
      name: entry.name,
      order: entry.order,
      contentType,
      filename: found.filename,
      fileId,
      hash,
      updatedAt: new Date(),
    };

    if (existing) {
      await db.collection("clients").updateOne({ _id: existing._id }, { $set: doc });
    } else {
      await db.collection("clients").insertOne({ ...doc, createdAt: new Date() });
    }
    console.log(`  ✓ ${entry.name} seeded (${contentType}, ${buf.length} bytes)`);
    seeded++;
  }

  // Seed Our Story asset into site_assets
  try {
    const storyFile = path.join(ASSETS, "ourstry.webp");
    await fs.access(storyFile);
    const buf = await fs.readFile(storyFile);
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    const existingStory = await db.collection("site_assets").findOne({ key: "ourstory" });
    if (!existingStory || existingStory.hash !== hash) {
      if (existingStory) {
        try { await bucket.delete(existingStory.fileId); } catch {}
      }
      const fileId = await new Promise((resolve, reject) => {
        const s = bucket.openUploadStream("ourstry.webp", {
          contentType: "image/webp",
          metadata: { key: "ourstory", hash },
        });
        s.on("error", reject);
        s.on("finish", () => resolve(s.id));
        s.end(buf);
      });
      const storyDoc = {
        key: "ourstory",
        alt: "BrandQube Execution",
        contentType: "image/webp",
        filename: "ourstry.webp",
        fileId,
        hash,
        updatedAt: new Date(),
      };
      if (existingStory) {
        await db.collection("site_assets").updateOne({ _id: existingStory._id }, { $set: storyDoc });
      } else {
        await db.collection("site_assets").insertOne({ ...storyDoc, createdAt: new Date() });
      }
      console.log(`  ✓ Our Story image seeded to MongoDB GridFS (${buf.length} bytes)`);
    }
  } catch (err) {
    console.warn(`  ⚠ Could not seed Our Story image: ${err.message}`);
  }

  // Seed Selected Work projects into projects collection & GridFS
  const WORK_PROJECTS = [
    {
      slug: "transit-advertising",
      client: "BrandQube Transit",
      title: "Continuous On-Road Brand Exposure",
      channel: "Transit Advertising",
      year: "2025",
      result: "High-Visibility Bus & Auto Routes",
      file: "Transit.png",
      order: 1,
      featured: true,
    },
    {
      slug: "wall-wrap-advertising",
      client: "BrandQube Wall Wrap",
      title: "High-Impact Wall Graphics & Localized Branding",
      channel: "Wall wrap Advertising",
      year: "2025",
      result: "100% Custom Space Flexibility",
      file: "wall_wrap.png",
      order: 2,
    },
    {
      slug: "demo-van-activity",
      client: "BrandQube Mobile Units",
      title: "Mobile Experiential Marketing & Lead Generation",
      channel: "Demo Van Activity",
      year: "2025",
      result: "Direct Local Audience Engagement",
      file: "Demo_Van.png",
      order: 3,
    },
    {
      slug: "mela-activities",
      client: "BrandQube Melas",
      title: "Exciting On-Ground Experiences & Live Vehicle Displays",
      channel: "Mela Activities",
      year: "2025",
      result: "Boosted Conversions & Customer Trust",
      file: "Mela_Activities.png",
      order: 4,
    },
    {
      slug: "showroom-development",
      client: "BrandQube Showrooms",
      title: "Complete Showroom Development & ACP Signage Work",
      channel: "Showroom Development",
      year: "2025",
      result: "Consistent Modern Retail Experience",
      file: "showroom_development.png",
      order: 5,
    },
    {
      slug: "outdoor-indoor-branding",
      client: "BrandQube 360 Branding",
      title: "Integrated Outdoor & Indoor Dealership Branding",
      channel: "Outdoor & Indoor Branding",
      year: "2025",
      result: "360° Brand Recall Across Key Touchpoints",
      file: "Indoor&Outdoor.png",
      order: 6,
    },
  ];

  for (const project of WORK_PROJECTS) {
    try {
      const fullPath = path.join(ASSETS, project.file);
      await fs.access(fullPath);
      const buf = await fs.readFile(fullPath);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");

      const existingProject = await db.collection("projects").findOne({ slug: project.slug });
      if (existingProject && existingProject.hash === hash) {
        console.log(`  = Project ${project.channel} unchanged`);
        continue;
      }
      if (existingProject) {
        try { await bucket.delete(existingProject.fileId); } catch {}
      }

      const fileId = await new Promise((resolve, reject) => {
        const stream = bucket.openUploadStream(project.file, {
          contentType: "image/png",
          metadata: { project: project.slug, hash },
        });
        stream.on("error", reject);
        stream.on("finish", () => resolve(stream.id));
        stream.end(buf);
      });

      const doc = {
        slug: project.slug,
        client: project.client,
        title: project.title,
        channel: project.channel,
        year: project.year,
        result: project.result,
        fileId,
        filename: project.file,
        contentType: "image/png",
        hash,
        order: project.order,
        featured: project.featured || false,
        updatedAt: new Date(),
      };

      if (existingProject) {
        await db.collection("projects").updateOne({ _id: existingProject._id }, { $set: doc });
      } else {
        await db.collection("projects").insertOne({ ...doc, createdAt: new Date() });
      }
      console.log(`  ✓ Project "${project.channel}" seeded to MongoDB GridFS (${buf.length} bytes)`);
    } catch (err) {
      console.warn(`  ⚠ Could not seed project ${project.file}: ${err.message}`);
    }
  }

  console.log(`\nDone. ${seeded} client logos seeded.`);
  await close();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
