import dns from "node:dns";
import { MongoClient, GridFSBucket } from "mongodb";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  // Ignore
}

// Global cache for Serverless environments (persists across warm function invocations)
let cached = global._mongoCache;
if (!cached) {
  cached = global._mongoCache = {
    client: null,
    db: null,
    bucket: null,
    promise: null,
  };
}

export const memoryEnquiries = [];
export const memoryCareers = [];

export async function connect() {
  if (cached.db) {
    return { db: cached.db, bucket: cached.bucket, client: cached.client };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI is not set. Operating in memory store mode.");
    return { db: null, bucket: null, client: null };
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 5000,
      maxPoolSize: 10,
    };

    cached.promise = MongoClient.connect(uri, opts).then((c) => {
      const database = c.db(process.env.DB_NAME || "brandqube");
      const b = new GridFSBucket(database, { bucketName: "logos" });

      // Non-blocking index creation in background
      database.collection("clients").createIndex({ order: 1, name: 1 }).catch(() => {});
      database.collection("clients").createIndex({ name: 1 }, { unique: true }).catch(() => {});

      console.log("✓ Connected to MongoDB Atlas successfully.");
      return { client: c, db: database, bucket: b };
    });
  }

  try {
    const res = await cached.promise;
    cached.client = res.client;
    cached.db = res.db;
    cached.bucket = res.bucket;
  } catch (e) {
    cached.promise = null;
    console.warn("⚠️ Could not connect to MongoDB Atlas directly:", e.message);
    console.warn("⚠️ Server running in resilient fallback mode (storing enquiries safely in memory).");
  }

  return { db: cached.db, bucket: cached.bucket, client: cached.client };
}

export function getDb() {
  return { db: cached.db, bucket: cached.bucket, client: cached.client };
}

export async function close() {
  if (cached.client) {
    await cached.client.close();
  }
  cached.client = cached.db = cached.bucket = cached.promise = null;
}

