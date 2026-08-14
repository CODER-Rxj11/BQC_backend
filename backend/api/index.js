import "dotenv/config";
import serverless from "serverless-http";
import app from "../src/server.js";
import { connect } from "../src/db.js";

const serverlessHandler = serverless(app);

export default async function handler(req, res) {
  // Ensure database connection attempt is initiated without blocking health checks
  if (req.url !== "/api/health" && req.url !== "/") {
    try {
      await Promise.race([
        connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("DB connection timeout")), 2000)),
      ]).catch((err) => {
        console.warn("DB connection warning in serverless handler:", err.message);
      });
    } catch (err) {
      console.error("Database connection error in serverless handler:", err);
    }
  }

  return serverlessHandler(req, res);
}
