// backend/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const {
  NODE_ENV = "development",
  CORS_ORIGIN = "http://localhost:5173",
  RATE_LIMIT_WINDOW_MS = "60000", // 1 minute
  RATE_LIMIT_MAX = "100", // 100 req/min/IP
} = process.env;

export const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS
const allowedOrigins = CORS_ORIGIN.split(",").map((s) => s.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser tools (no Origin) and listed origins
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
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
    windowMs: Number(RATE_LIMIT_WINDOW_MS),
    max: Number(RATE_LIMIT_MAX),
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
