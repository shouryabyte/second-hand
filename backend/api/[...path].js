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

module.exports = async (req, res) => {
  if (!dbPromise) {
    dbPromise = connectDb(process.env.MONGODB_URI);
  }
  await dbPromise;
  return app(req, res);
};