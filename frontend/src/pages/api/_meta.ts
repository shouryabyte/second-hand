import type { NextApiRequest, NextApiResponse } from "next";

function normalizeBase(raw: string) {
  return raw.replace(/\/$/, "").replace(/\/api$/, "");
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const r = await fetch(input, init);
    const text = await r.text().catch(() => "");
    return { ok: r.ok, status: r.status, text: text.slice(0, 500) };
  } catch (e: any) {
    return { ok: false, status: 0, error: String(e?.message || e) };
  }
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";
  const apiOrigin = raw ? normalizeBase(raw) : "";

  const backend = apiOrigin
    ? {
        health: await safeFetch(`${apiOrigin}/api/health`, { cache: "no-store" as any }),
        authPing: await safeFetch(`${apiOrigin}/api/auth/ping`, { cache: "no-store" as any }),
        authLoginProbe: await safeFetch(`${apiOrigin}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        })
      }
    : null;

  res.status(200).json({
    ok: true,
    vercel: {
      env: process.env.VERCEL_ENV || null,
      sha: process.env.VERCEL_GIT_COMMIT_SHA || null
    },
    apiOrigin,
    backend
  });
}