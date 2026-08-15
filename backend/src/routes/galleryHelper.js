import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { getDb } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_ASSETS_DIR = path.resolve(__dirname, "..", "..", "seed_assets");

/**
 * Creates a standard Express router for any work gallery category.
 * Streams real images directly from MongoDB GridFS with local filesystem fallback.
 *
 * @param {Object} categoryConfig Configuration for the gallery category
 */
export function createCategoryRouter(categoryConfig) {
  const router = Router();

  function getBaseUrl(req) {
    const envBase = (process.env.BACKEND_URL || process.env.API_URL || "").trim().replace(/\/$/, "");
    return envBase || `${req.protocol}://${req.get("host")}`;
  }

  // GET / -> List all items with streamable image URLs
  router.get("/", async (req, res, next) => {
    try {
      const base = getBaseUrl(req);
      const { db } = getDb();

      let items = [];

      if (db) {
        const docs = await db
          .collection("gallery_assets")
          .find({ category: categoryConfig.category })
          .sort({ order: 1, filename: 1 })
          .toArray();

        if (docs.length > 0) {
          items = docs.map((doc) => {
            const v = doc.hash ? doc.hash.substring(0, 8) : Date.now();
            return {
              id: doc.id || doc.filename,
              filename: doc.filename,
              client: doc.client,
              title: doc.title,
              channel: doc.channel,
              year: doc.year || "2025",
              imageUrl: `${base}${categoryConfig.apiPrefix}/${encodeURIComponent(doc.id || doc.filename)}/image?v=${v}`,
            };
          });
        }
      }

      // Local / in-memory fallback if not yet in DB
      if (items.length === 0) {
        items = categoryConfig.files.map((file, idx) => {
          const client = categoryConfig.getClient(file);
          const title = categoryConfig.getTitle(file, client);
          return {
            id: file,
            filename: file,
            client,
            title,
            channel: categoryConfig.channel,
            year: "2025",
            imageUrl: `${base}${categoryConfig.apiPrefix}/${encodeURIComponent(file)}/image`,
            order: idx + 1,
          };
        });
      }

      res.set("Cache-Control", "public, max-age=60");
      res.json(items);
    } catch (e) {
      next(e);
    }
  });

  // GET /:id/image -> Stream image binary from MongoDB GridFS or local seed asset
  router.get("/:id/image", async (req, res, next) => {
    try {
      const assetId = decodeURIComponent(req.params.id);
      const { db, bucket } = getDb();

      if (db && bucket) {
        const doc = await db.collection("gallery_assets").findOne({
          $or: [
            { id: assetId },
            { filename: assetId },
            { id: `${categoryConfig.folder}_${assetId}` },
          ],
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

      // Local filesystem fallback from seed_assets directory
      const localCandidates = [
        path.join(SEED_ASSETS_DIR, categoryConfig.folder, assetId),
        path.join(SEED_ASSETS_DIR, assetId),
        path.join(SEED_ASSETS_DIR, categoryConfig.folder, path.basename(assetId)),
      ];

      for (const filePath of localCandidates) {
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

      res.status(404).json({ error: "Asset not found" });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
