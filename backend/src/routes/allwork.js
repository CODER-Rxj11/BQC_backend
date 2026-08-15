import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { getDb } from "../db.js";
import { GALLERY_CATEGORIES } from "../galleryData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_ASSETS_DIR = path.resolve(__dirname, "..", "..", "seed_assets");

function getBaseUrl(req) {
  const envBase = (process.env.BACKEND_URL || process.env.API_URL || "").trim().replace(/\/$/, "");
  return envBase || `${req.protocol}://${req.get("host")}`;
}

/** GET /api/all-work-assets — returns all gallery assets across all channels */
router.get("/", async (req, res, next) => {
  try {
    const base = getBaseUrl(req);
    const { db } = getDb();

    let allItems = [];

    if (db) {
      const docs = await db
        .collection("gallery_assets")
        .find({})
        .sort({ order: 1, filename: 1 })
        .toArray();

      if (docs.length > 0) {
        allItems = docs.map((doc) => {
          const v = doc.hash ? doc.hash.substring(0, 8) : Date.now();
          const categoryConfig = GALLERY_CATEGORIES.find((c) => c.category === doc.category);
          const apiPrefix = categoryConfig ? categoryConfig.apiPrefix : "/api/all-work-assets";
          return {
            id: doc.id || doc.filename,
            filename: doc.filename,
            client: doc.client,
            title: doc.title,
            channel: doc.channel,
            category: doc.category,
            year: doc.year || "2025",
            imageUrl: `${base}${apiPrefix}/${encodeURIComponent(doc.id || doc.filename)}/image?v=${v}`,
          };
        });
      }
    }

    if (allItems.length === 0) {
      for (const group of GALLERY_CATEGORIES) {
        for (const file of group.files) {
          const client = group.getClient(file);
          const title = group.getTitle(file, client);
          allItems.push({
            id: `${group.folder}_${file}`,
            filename: file,
            client,
            title,
            channel: group.channel,
            category: group.category,
            year: "2025",
            imageUrl: `${base}${group.apiPrefix}/${encodeURIComponent(file)}/image`,
          });
        }
      }
    }

    res.set("Cache-Control", "public, max-age=60");
    res.json(allItems);
  } catch (e) {
    next(e);
  }
});

/** GET /api/all-work-assets/:id/image — image streaming fallback for all work assets */
router.get("/:id/image", async (req, res, next) => {
  try {
    const assetId = decodeURIComponent(req.params.id);
    const { db, bucket } = getDb();

    if (db && bucket) {
      const doc = await db.collection("gallery_assets").findOne({
        $or: [{ id: assetId }, { filename: assetId }],
      });

      if (doc && doc.fileId) {
        const etag = doc.hash ? `"${doc.hash}"` : undefined;
        if (etag && req.headers["if-none-match"] === etag) {
          return res.status(304).end();
        }

        res.set("Content-Type", doc.contentType || "image/png");
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        if (etag) res.set("ETag", etag);

        return bucket
          .openDownloadStream(doc.fileId)
          .on("error", () => res.status(404).end())
          .pipe(res);
      }
    }

    // Try finding across all categories
    for (const group of GALLERY_CATEGORIES) {
      const candidates = [
        path.join(SEED_ASSETS_DIR, group.folder, assetId),
        path.join(SEED_ASSETS_DIR, group.folder, path.basename(assetId)),
        path.join(SEED_ASSETS_DIR, assetId),
      ];

      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".webp": "image/webp",
          };
          res.set("Content-Type", mimeTypes[ext] || "image/png");
          res.set("Cache-Control", "public, max-age=31536000, immutable");
          return fs.createReadStream(filePath).pipe(res);
        }
      }
    }

    res.status(404).json({ error: "Asset not found" });
  } catch (e) {
    next(e);
  }
});
