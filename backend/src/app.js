// backend/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_LOCALHOST_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const NODE_ENV = process.env.NODE_ENV ?? "development";

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const rateLimitWindowMs = parsePositiveInt(
  process.env.RATE_LIMIT_WINDOW_MS,
  DEFAULT_RATE_LIMIT_WINDOW_MS
);
const rateLimitMax = parsePositiveInt(process.env.RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX);

const parseOrigins = (value) =>
  String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const configuredOrigins = parseOrigins(process.env.CORS_ORIGIN);
const allowedOriginList = configuredOrigins.length
  ? Array.from(new Set(configuredOrigins))
  : DEFAULT_LOCALHOST_ORIGINS;
const allowAllOrigins = allowedOriginList.includes("*");

export const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser tools (no Origin) and listed origins
      if (
        !origin ||
        allowAllOrigins ||
        allowedOriginList.includes(origin)
      ) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// Rate limiting (basic)
app.use(
  rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// --- Health checks
app.get("/health", (_req, res) =>
  res.json({
    ok: true,
    env: NODE_ENV,
    ts: new Date().toISOString(),
  })
);
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, api: "v1", ts: new Date().toISOString() })
);

// --- Placeholder API routes (you’ll replace with real routers later)
const router = express.Router();
router.get("/", (_req, res) => res.json({ message: "AI Quiz API root" }));

// Example: not implemented stubs (replace later)
// router.use("/auth", authRouter);
// router.use("/quiz", quizRouter);

app.use("/api", router);

// 404 handler
app.use((req, res, _next) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Error]", err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
});
