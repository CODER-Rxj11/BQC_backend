import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB — logos are tiny
});

const router = Router();

function toPublic(req, c) {
  const base = `${req.protocol}://${req.get("host")}`;
  return {
    id: c._id.toString(),
    name: c.name,
    order: c.order ?? 0,
    logoUrl: `${base}/api/clients/${c._id.toString()}/logo`,
  };
}

/** GET /api/clients — ordered list with a streamable logoUrl for each. */
router.get("/", async (req, res, next) => {
  try {
    const { db } = getDb();
    if (!db) return res.json([]);
    const items = await db
      .collection("clients")
      .find({}, { projection: { name: 1, order: 1 } })
      .sort({ order: 1, name: 1 })
      .toArray();
    res.set("Cache-Control", "public, max-age=60");
    res.json(items.map((c) => toPublic(req, c)));
  } catch (e) {
    next(e);
  }
});

/** GET /api/clients/:id/logo — stream bytes from GridFS with long-lived cache. */
router.get("/:id/logo", async (req, res, next) => {
  try {
    const { db, bucket } = getDb();
    if (!db || !bucket) return res.status(404).json({ error: "not found" });
    let _id;
    try {
      _id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: "invalid id" });
    }

    const client = await db.collection("clients").findOne({ _id });
    if (!client) return res.status(404).json({ error: "not found" });

    // ETag revalidation — logos are immutable per content hash.
    const etag = client.hash ? `"${client.hash}"` : undefined;
    if (etag && req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }

    res.set("Content-Type", client.contentType || "application/octet-stream");
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    if (etag) res.set("ETag", etag);

    bucket
      .openDownloadStream(client.fileId)
      .on("error", () => res.status(404).end())
      .pipe(res);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/clients — multipart upload (field "logo" + "name", optional "order").
 * Upserts by name and replaces the old GridFS file. Protected by ADMIN_TOKEN if set.
 */
router.post("/", upload.single("logo"), async (req, res, next) => {
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    if (adminToken && req.headers["x-admin-token"] !== adminToken) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!req.file) return res.status(400).json({ error: "logo file is required" });
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "name is required" });
    const order = Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : 0;

    const { db, bucket } = getDb();
    const hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

    const fileId = await new Promise((resolve, reject) => {
      const stream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { name, hash },
      });
      stream.on("error", reject);
      stream.on("finish", () => resolve(stream.id));
      stream.end(req.file.buffer);
    });

    const doc = {
      name,
      order,
      contentType: req.file.mimetype,
      filename: req.file.originalname,
      fileId,
      hash,
      updatedAt: new Date(),
    };

    const existing = await db.collection("clients").findOne({ name });
    if (existing) {
      try {
        await bucket.delete(existing.fileId);
      } catch {
        /* old file already gone — ignore */
      }
      await db.collection("clients").updateOne({ _id: existing._id }, { $set: doc });
      return res.json(toPublic(req, { _id: existing._id, ...doc }));
    }

    const r = await db.collection("clients").insertOne({ ...doc, createdAt: new Date() });
    res.status(201).json(toPublic(req, { _id: r.insertedId, ...doc }));
  } catch (e) {
    next(e);
  }
});

export default router;
