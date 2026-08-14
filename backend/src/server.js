import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connect } from "./db.js";
import clientsRouter from "./routes/clients.js";
import ourstoryRouter from "./routes/ourstory.js";
import projectsRouter from "./routes/projects.js";
import enquiriesRouter from "./routes/enquiries.js";
import careersRouter from "./routes/careers.js";
import showroomRouter from "./routes/showroom.js";
import melaRouter from "./routes/mela.js";
import corporateRouter from "./routes/corporate.js";
import transitRouter from "./routes/transit.js";
import demovanRouter from "./routes/demovan.js";
import wallwrapRouter from "./routes/wallwrap.js";
import allworkRouter from "./routes/allwork.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Trust reverse proxy (Vercel, Render, AWS, Heroku, Nginx, etc.)
app.set("trust proxy", 1);

// Allowed origins for CORS (local dev + production frontend URLs)
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
];

const envOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
]
  .filter(Boolean)
  .flatMap((val) => val.split(","))
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, Postman, health check probes)
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, "");
    if (
      allowedOrigins.includes("*") ||
      allowedOrigins.includes(cleanOrigin) ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Allow origin dynamically
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-admin-token"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());



// Health check routes for uptime monitoring and deployment verification
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "brandqube-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "brandqube-api",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/clients", clientsRouter);
app.use("/api/ourstory", ourstoryRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/enquiries", enquiriesRouter);
app.use("/api/careers", careersRouter);
app.use("/api/showroom-assets", showroomRouter);
app.use("/api/mela-assets", melaRouter);
app.use("/api/corporate-events-assets", corporateRouter);
app.use("/api/transit-assets", transitRouter);
app.use("/api/demo-van-assets", demovanRouter);
app.use("/api/wall-wrap-assets", wallwrapRouter);
app.use("/api/all-work-assets", allworkRouter);

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[error]", err.message);
  res.status(500).json({ error: err.message || "server error" });
});

// Decouple listen for Serverless vs Standalone execution
export default app;
export { app };

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.SERVERLESS
);

// Only start listening if this file is executed directly (e.g., node src/server.js or npm run dev)
const isDirectRun = Boolean(
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (!isServerless && isDirectRun) {
  const port = process.env.PORT || 4000;
  connect()
    .then(() => {
      app.listen(port, () => console.log(`✓ BrandQube API listening on port ${port}`));
    })
    .catch((e) => {
      console.error("✗ Could not connect to MongoDB:", e.message);
      process.exit(1);
    });
}

