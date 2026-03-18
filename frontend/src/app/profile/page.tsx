"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Me = Awaited<ReturnType<typeof api.me>>;

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    api
      .me()
      .then(setMe)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"));
  }, [router]);

  function logout() {
    clearToken();
    router.push("/");
  }

  return (
    <div className="grid">
      <div className="col12">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 950, fontSize: 20 }}>Your profile</div>
              <div className="help">Account details, reputation and quick actions.</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn btnSecondary" href="/listings">
                Browse
              </Link>
              <Link className="btn" href="/listings/new">
                Sell
              </Link>
              <button className="btn btnDanger" onClick={logout}>
                Logout
              </button>
            </div>
          </div>

          {error ? <div className="error">{error}</div> : null}
          {!error && !me ? <div className="help" style={{ marginTop: 12 }}>Loading...</div> : null}

          {me ? (
            <div className="grid" style={{ marginTop: 12 }}>
              <div className="col6">
                <div className="cardSoft">
                  <div className="badge">Account</div>
                  <div style={{ fontSize: 26, fontWeight: 950, marginTop: 10 }}>{me.displayName}</div>
                  <div className="help" style={{ marginTop: 8 }}>
                    Email: {me.email || "—"}
                    <br />
                    Phone: {me.phone || "—"}
                  </div>
                  <div className="help" style={{ marginTop: 8 }}>
                    Joined: {new Date(me.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="col6">
                <div className="cardSoft">
                  <div className="badge">Trust</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span className="pill">Role: {me.role}</span>
                    <span className="pill">Verified seller: {me.isVerifiedSeller ? "Yes" : "No"}</span>
                    <span className="pill">
                      Rating: {me.ratingAvg} ({me.ratingCount})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
