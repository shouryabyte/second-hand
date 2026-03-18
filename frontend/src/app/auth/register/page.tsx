"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.register({
        displayName,
        password,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined
      });
      setToken(res.token);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
              <div style={{ fontWeight: 950, fontSize: 20 }}>Create account</div>
              <div className="help">Use email/password now. Phone OTP is available too.</div>
            </div>
            <Link href="/auth/login" className="pill">
              Login
            </Link>
          </div>

          <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
            <div className="grid">
              <div className="col6">
                <label>Display name</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Prabhakar" />
              </div>
              <div className="col6">
                <label>Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Min 8 chars" />
              </div>
              <div className="col6">
                <label>Email (optional)</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="col6">
                <label>Phone (optional)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9xxxx xxxxx" />
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" disabled={busy}>
                {busy ? "Creating..." : "Create account"}
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
