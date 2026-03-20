const express = require("express");
require("express-async-errors");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const meRoutes = require("./routes/me");
const listingsRoutes = require("./routes/listings");
const threadsRoutes = require("./routes/threads");
const wishlistRoutes = require("./routes/wishlist");
const offersRoutes = require("./routes/offers");
const paymentsRoutes = require("./routes/payments");
const aiRoutes = require("./routes/ai");
const adminRoutes = require("./routes/admin");

function createApp() {
  const app = express();

  // Production Upgrade: respect proxy headers on Vercel (needed for rate limiting + protocol)
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // Production Upgrade: security headers (API-friendly defaults)
  app.use(
    helmet({
      // API-only project: disable CSP to avoid surprises in non-browser clients.
      contentSecurityPolicy: false
    })
  );

  // Production Upgrade: basic global rate limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_PER_15M || 600),
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(globalLimiter);

    const allowedOriginsRaw = process.env.CORS_ORIGIN;
  const allowedOrigins = allowedOriginsRaw
    ? allowedOriginsRaw
        .split(",")
        .map((x) => String(x).trim())
        .filter(Boolean)
    : null;

  function matchOrigin(pattern, origin) {
    if (pattern === "*") return true;
    if (!pattern.includes("*")) return pattern === origin;

    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*");
    return new RegExp(`^${escaped}$`).test(origin);
  }

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!allowedOrigins) return cb(null, true);
        if (!origin) return cb(null, true);
        const ok = allowedOrigins.some((p) => matchOrigin(p, origin));
        return cb(null, ok);
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: "5mb" }));

  // Root route: handy for quick checks in the browser.
  app.get("/", (req, res) => res.json({ ok: true, service: "sh-marketplace-api" }));
  // Lightweight health check (does not require DB)
  app.get("/health", (req, res) => res.json({ ok: true }));

  // Vercel: API routes live under /api/*
  app.get("/api/health", (req, res) => res.json({ ok: true }));

  // Local uploads (non-persistent on serverless). Prefer Cloudinary in production.
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Production Upgrade: tighter limit for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT_PER_10M || 60),
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/me", meRoutes);
  app.use("/api/listings", listingsRoutes);
  app.use("/api/threads", threadsRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/offers", offersRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/admin", adminRoutes);

  app.use((req, res) => res.status(404).json({ error: "Not found" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // Production Upgrade: log server errors for observability
    // eslint-disable-next-line no-console
    console.error(err);

    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({ error: isProd ? "Server error" : String(err?.message || err || "Server error") });
  });

  return app;
}

module.exports = { createApp };