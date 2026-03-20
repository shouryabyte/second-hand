"use client";

import { useEffect, useState } from "react";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// UX Fix: show a clear, non-blocking banner when backend is down/misconfigured.
export function BackendStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 1500);

    fetch(`${baseUrl}/api/health`, { signal: controller.signal })
      .then((r) => setOffline(!r.ok))
      .catch(() => setOffline(true))
      .finally(() => clearTimeout(t));
  }, []);

  if (!offline) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-3 sm:px-6">
      <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
        Backend not reachable. Check <span className="font-semibold">NEXT_PUBLIC_API_BASE_URL</span> ({baseUrl}) and ensure the backend is running.
      </div>
    </div>
  );
}