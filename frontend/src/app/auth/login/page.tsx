"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.login({ email, password });
      setToken(res.token);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="col12">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 950, fontSize: 20 }}>Login</div>
              <div className="help">Email/password login for the demo.</div>
            </div>
            <Link href="/auth/register" className="pill">
              Create account
            </Link>
          </div>

          <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
            <div className="grid">
              <div className="col6">
                <label>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="col6">
                <label>Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" disabled={busy}>
                {busy ? "Signing in..." : "Login"}
              </button>
              <Link className="btn btnSecondary" href="/auth/phone">
                Use phone OTP
              </Link>
              <Link className="btn btnSecondary" href="/listings">
                Continue as guest
              </Link>
            </div>

            {error ? <div className="error">{error}</div> : null}
          </form>
        </div>
      </div>
    </div>
  );
}
