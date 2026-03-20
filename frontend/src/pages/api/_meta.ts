import type { NextApiRequest, NextApiResponse } from "next";

function normalizeBase(raw: string) {
  return raw.replace(/\/$/, "").replace(/\/api$/, "");
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";
  const apiOrigin = raw ? normalizeBase(raw) : "";

  let backendHealth: any = null;
  if (apiOrigin) {
    try {
      const r = await fetch(`${apiOrigin}/api/health`, { cache: "no-store" as any });
      backendHealth = { ok: r.ok, status: r.status };
    } catch (e: any) {
      backendHealth = { ok: false, error: String(e?.message || e) };
    }
  }

  res.status(200).json({
    ok: true,
    vercel: {
      env: process.env.VERCEL_ENV || null,
      sha: process.env.VERCEL_GIT_COMMIT_SHA || null
    },
    apiOrigin,
    backendHealth
  });
}