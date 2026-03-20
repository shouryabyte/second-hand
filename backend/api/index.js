// Single Vercel Serverless Function entrypoint.
// `vercel.json` routes all requests to this file so Express routing is consistent.

try {
  require("dotenv").config();
} catch {
  // ignore
}

const handler = require("../src/app");

function normalizeUrl(url) {
  const u = String(url || "");
  if (!u.startsWith("/")) return "/" + u;
  // If already under /api, keep it. Otherwise, prefix /api so Express-mounted routes match.
  if (u === "/" || u.startsWith("/?")) return u;
  if (u.startsWith("/api/")) return u;
  return "/api" + u;
}

module.exports = async (req, res) => {
  req.url = normalizeUrl(req.url);
  return handler(req, res);
};