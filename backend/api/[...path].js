// Vercel Serverless entry: handles all `/api/*` routes via the Express app.
// Deploy `backend` as a separate Vercel project (Root Directory: backend).

try {
  // Local dev convenience (Vercel provides env vars via dashboard)
  require("dotenv").config();
} catch {
  // ignore
}

const { createApp } = require("../src/app");
const { connectDb } = require("../src/config/db");

const app = createApp();
let dbPromise;

function applyCors(req, res) {
  const origin = req?.headers?.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  const reqHeaders = req?.headers?.["access-control-request-headers"];
  res.setHeader("Access-Control-Allow-Headers", reqHeaders || "Content-Type,Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function normalizeUrl(url) {
  const u = String(url || "");
  if (!u.startsWith("/")) return "/" + u;
  if (u === "/" || u.startsWith("/?")) return u;
  if (u === "/health" || u.startsWith("/health?")) return u;
  if (u.startsWith("/uploads")) return u;

  // IMPORTANT:
  // Vercel can invoke this function with req.url either including `/api/...` or stripped to `/<path>`.
  // Make Express always see `/api/...` so mounted routes match reliably.
  if (u.startsWith("/api/")) return u;
  return "/api" + u;
}

function isHealthRequest(req) {
  const url = String(req?.url || "");
  return (
    url === "/" ||
    url.startsWith("/?") ||
    url === "/health" ||
    url.startsWith("/health?") ||
    url === "/api/health" ||
    url.startsWith("/api/health?")
  );
}

module.exports = async (req, res) => {
  try {
    // Normalize first so downstream middleware sees consistent paths.
    req.url = normalizeUrl(req.url);

    applyCors(req, res);
    if (req?.method === "OPTIONS") return res.status(204).end();

    // Health checks must stay up even if DB is misconfigured/down.
    if (!isHealthRequest(req)) {
      if (!dbPromise) {
        dbPromise = connectDb(process.env.MONGODB_URI);
      }
      await dbPromise;
    }

    return app(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);

    const isProd = process.env.NODE_ENV === "production";
    const message = isProd ? "Server error" : String(err?.message || err || "Server error");
    return res.status(500).json({ error: message });
  }
};