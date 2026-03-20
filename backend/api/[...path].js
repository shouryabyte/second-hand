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

function isHealthRequest(req) {
  const url = String(req?.url || "");
  return url === "/health" || url.startsWith("/health?") || url === "/api/health" || url.startsWith("/api/health?");
}

module.exports = async (req, res) => {
  try {
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