import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

const router = Router();

function toPublic(req, doc) {
  const base = `${req.protocol}://${req.get("host")}`;
  const v = doc.hash ? doc.hash.substring(0, 8) : (doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now());
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    client: doc.client,
    title: doc.title,
    channel: doc.channel,
    year: doc.year || "2025",
    result: doc.result || "BrandQube Execution",
    brief: doc.brief || "",
    briefImage: doc.briefImage || undefined,
    canvas: doc.canvas || "Pan-India",
    featured: doc.featured || false,
    image: `${base}/api/projects/${doc._id.toString()}/image?v=${v}`,
  };
}

/** GET /api/projects — returns list of selected work projects with GridFS streamable image URLs */
router.get("/", async (req, res, next) => {
  try {
    const { db } = getDb();
    if (!db) return res.json([]);
    const items = await db
      .collection("projects")
      .find({})
      .sort({ order: 1 })
      .toArray();
    res.set("Cache-Control", "no-cache");
    res.json(items.map((doc) => toPublic(req, doc)));
  } catch (e) {
    next(e);
  }
});

/** GET /api/projects/:id/image — stream raw image bytes from MongoDB GridFS */
router.get("/:id/image", async (req, res, next) => {
  try {
    const { db, bucket } = getDb();
    if (!db || !bucket) return res.status(404).json({ error: "not found" });
    let _id;
    try {
      _id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: "invalid id" });
    }

    const doc = await db.collection("projects").findOne({ _id });
    if (!doc) return res.status(404).json({ error: "not found" });

    const etag = doc.hash ? `"${doc.hash}"` : undefined;
    if (etag && req.headers["if-none-match"] === etag) return res.status(304).end();

    res.set("Content-Type", doc.contentType || "image/png");
    res.set("Cache-Control", "public, max-age=3600, must-revalidate");
    if (etag) res.set("ETag", etag);

    bucket.openDownloadStream(doc.fileId).on("error", () => res.status(404).end()).pipe(res);
  } catch (e) {
    next(e);
  }
});

export default router;
