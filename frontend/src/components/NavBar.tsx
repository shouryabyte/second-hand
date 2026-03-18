"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

export function NavBar() {
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
    <div className="nav">
      <Link href="/" className="brand">
        <div className="logo" aria-hidden />
        <div>
          <div className="brandTitle">NexChakra Market</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Second-hand marketplace</div>
        </div>
      </Link>

      <div className="navLinks">
        <Link className="pill" href="/listings">
          Browse Listings
        </Link>
        <Link className="pill" href="/listings/new">
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
  );
}
