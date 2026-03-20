import type { NextApiRequest, NextApiResponse } from "next";

function getApiOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";
  return raw.replace(/\/$/, "");
}

function stripHopByHop(headers: NextApiRequest["headers"]) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (!v) continue;
    const key = k.toLowerCase();
    if (["host", "connection", "content-length", "accept-encoding"].includes(key)) continue;
    out[key] = Array.isArray(v) ? v.join(",") : String(v);
  }
  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    res.status(500).json({ error: "Missing NEXT_PUBLIC_API_BASE_URL (or API_BASE_URL)" });
    return;
  }

  const rest = Array.isArray(req.query.path) ? req.query.path.join("/") : String(req.query.path || "");
  const qsIndex = (req.url || "").indexOf("?");
  const qs = qsIndex >= 0 ? (req.url || "").slice(qsIndex) : "";
  const targetUrl = `${apiOrigin}/api/${rest}${qs}`;

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: stripHopByHop(req.headers),
    body: req.method && ["GET", "HEAD"].includes(req.method.toUpperCase()) ? undefined : (req as any)
  });

  res.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (["content-encoding", "transfer-encoding", "content-length"].includes(lower)) return;
    res.setHeader(key, value);
  });
  res.setHeader("Cache-Control", "no-store");

  const buf = Buffer.from(await upstream.arrayBuffer());
  res.send(buf);
}