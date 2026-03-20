const express = require("express");
require("express-async-errors");
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

function applyCorsHeaders(req, res) {
  const origin = req?.headers?.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function createApp() {
  const app = express();

  // Production Upgrade: respect proxy headers on Vercel (needed for rate limiting + protocol)
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // CORS: must run before any middleware that may reject requests (rate limit, auth, etc.)
  // We do NOT use cookies; auth is via Authorization header, so credentials stay disabled.
  app.use((req, res, next) => {
    applyCorsHeaders(req, res);
    if (req.method === "OPTIONS") return res.status(204).end();
    return next();
  });

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

  app.use(["/api/auth", "/auth"], authLimiter, authRoutes);
  app.use(["/api/me", "/me"], meRoutes);
  app.use(["/api/listings", "/listings"], listingsRoutes);
  app.use(["/api/threads", "/threads"], threadsRoutes);
  app.use(["/api/wishlist", "/wishlist"], wishlistRoutes);
  app.use(["/api/offers", "/offers"], offersRoutes);
  app.use(["/api/payments", "/payments"], paymentsRoutes);
  app.use(["/api/ai", "/ai"], aiRoutes);
  app.use(["/api/admin", "/admin"], adminRoutes);

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

const { connectDb } = require("./config/db");

let cachedApp;
let dbPromise;

// Vercel/Serverless compatibility: some deployments may try to execute `src/app.js` as the entry.
// Export a handler function (and keep `createApp` available for local `server.js` and tests).
async function handler(req, res) {
  try {
    applyCorsHeaders(req, res);
    if (req?.method === "OPTIONS") return res.status(204).end();

    const url = String(req?.url || "");
    const isHealth =
      url === "/" ||
      url.startsWith("/?") ||
      url === "/health" ||
      url.startsWith("/health?") ||
      url === "/api/health" ||
      url.startsWith("/api/health?");

    const isTrivialAsset = url === "/favicon.ico" || url === "/favicon.png";

    if (!isHealth && !isTrivialAsset) {
      if (!dbPromise) {
        dbPromise = connectDb(process.env.MONGODB_URI);
      }
      await dbPromise;
    }

    if (!cachedApp) cachedApp = createApp();
    return cachedApp(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);

    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({ error: isProd ? "Server error" : String(err?.message || err || "Server error") });
  }
}

handler.createApp = createApp;
module.exports = handler;
module.exports.createApp = createApp;
