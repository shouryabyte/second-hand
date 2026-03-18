"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

export default function HomePage() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const update = () => setHasToken(Boolean(getToken()));
    update();

    window.addEventListener("auth_token_changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("auth_token_changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <div className="grid">
      <div className="col12">
        <div className="card">
          <h1>Buy & Sell Pre-Owned Items Safely</h1>
          <div className="subtitle">
            Discover great deals nearby, list your items in minutes, and connect with trusted sellers.
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" href="/listings">
              Browse Listings
            </Link>
            <Link className="btn btnSecondary" href="/listings/new">
              Sell Item
            </Link>
            {hasToken ? (
              <Link className="btn btnSecondary" href="/profile">
                Profile
              </Link>
            ) : (
              <Link className="btn btnSecondary" href="/auth/login">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
