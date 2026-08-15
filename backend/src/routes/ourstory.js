import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import { getDb } from "../db.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const router = Router();

function toPublic(req, doc) {
  const envBase = (process.env.BACKEND_URL || process.env.API_URL || "").trim().replace(/\/$/, "");
  const base = envBase || `${req.protocol}://${req.get("
  return {
    key: "ourstory",
    alt: doc.alt || "Our story image",
    imageUrl: `${base}/api/ourstory/image`,
    updatedAt: doc.updatedAt,
  };
}

/** GET /api/ourstory — returns metadata with an imageUrl that streams the image */
router.get("/", async (req, res, next) => {
  try {
    const { db } = getDb();
    if (!db) return res.status(404).json({ error: "not found" });
    const doc = await db.collection("site_assets").findOne({ key: "ourstory" });
    if (!doc) return res.status(404).json({ error: "not found" });
    res.set("Cache-Control", "public, max-age=60");
    res.json(toPublic(req, doc));
  } catch (e) {
    next(e);
  }
});

/** GET /api/ourstory/image — stream the bytes from GridFS */
router.get("/image", async (req, res, next) => {
  try {
    const { db, bucket } = getDb();
    if (!db || !bucket) return res.status(404).json({ error: "not found" });
    const doc = await db.collection("site_assets").findOne({ key: "ourstory" });
    if (!doc) return res.status(404).json({ error: "not found" });

    const etag = doc.hash ? `"${doc.hash}"` : undefined;
    if (etag && req.headers["if-none-match"] === etag) return res.status(304).end();

    res.set("Content-Type", doc.contentType || "application/octet-stream");
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    if (etag) res.set("ETag", etag);

    bucket.openDownloadStream(doc.fileId).on("error", () => res.status(404).end()).pipe(res);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/ourstory — multipart upload (field "image", optional "alt").
 * Protected by ADMIN_TOKEN if set. Upserts the single asset and replaces old file.
 */
router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    if (adminToken && req.headers["x-admin-token"] !== adminToken) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!req.file) return res.status(400).json({ error: "image file is required" });

    const alt = String(req.body.alt || "").trim() || undefined;
    const { db, bucket } = getDb();
    const hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

    const fileId = await new Promise((resolve, reject) => {
      const stream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { key: "ourstory", hash },
      });
      stream.on("error", reject);
      stream.on("finish", () => resolve(stream.id));
      stream.end(req.file.buffer);
    });

    const doc = {
      key: "ourstory",
      alt,
      contentType: req.file.mimetype,
      filename: req.file.originalname,
      fileId,
      hash,
      updatedAt: new Date(),
    };

    const existing = await db.collection("site_assets").findOne({ key: "ourstory" });
    if (existing) {
      try {
        await bucket.delete(existing.fileId);
      } catch {
        /* ignore */
      }
      await db.collection("site_assets").updateOne({ _id: existing._id }, { $set: doc });
      return res.json(toPublic(req, { ...existing, ...doc }));
    }

    const r = await db.collection("site_assets").insertOne({ ...doc, createdAt: new Date() });
    res.status(201).json(toPublic(req, { _id: r.insertedId, ...doc }));
  } catch (e) {
    next(e);
  }
});

export default router;
