"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { ArrowRight, ShieldCheck, Sparkles, Store } from "lucide-react";

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
    <div className="grid gap-6">
      {/* UI Upgrade: premium hero section with gradient text + motion */}
      <section className="glass overflow-hidden p-7 sm:p-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              <Sparkles className="h-3.5 w-3.5" />
              Trusted marketplace experience
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="text-gradient">Buy & Sell Pre-Owned Items Safely</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200/80">
              Discover great deals nearby, list your items in minutes, and connect with verified sellers — with modern chat and secure payments.
            </p>

            {/* UI Upgrade: clean CTA cluster (only relevant actions) */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="btn-primary" href="/listings">
                Browse Listings
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="btn-secondary" href="/listings/new">
                Sell Item
              </Link>
              {hasToken ? (
                <Link className="btn-ghost" href="/profile">
                  Profile
                </Link>
              ) : (
                <Link className="btn-ghost" href="/auth/login">
                  Login
                </Link>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <span className="chip">
                <ShieldCheck className="h-3.5 w-3.5" />
                Buyer protection
              </span>
              <span className="chip">
                <Store className="h-3.5 w-3.5" />
                Verified sellers
              </span>
            </div>
          </motion.div>

          {/* UI Upgrade: illustration via floating glass cards (no placeholder content) */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute -inset-10 opacity-40 blur-2xl" aria-hidden>
              <div className="h-full w-full rounded-[40px] bg-gradient-to-br from-violet-600/30 via-indigo-600/15 to-sky-500/25" />
            </div>

            <div className="relative grid gap-4">
              <div className="glass p-5 shadow-glow transition-all duration-300 hover:shadow-glowHover">
                <div className="text-sm font-semibold text-white">Today’s picks</div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="aspect-[4/3] rounded-2xl bg-white/5 ring-1 ring-white/10" />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5">
                  <div className="text-xs text-slate-300/80">Sell faster</div>
                  <div className="mt-1 text-2xl font-extrabold tracking-tight text-white">AI hints</div>
                  <div className="mt-2 text-sm text-slate-200/75">Smart descriptions and pricing suggestions.</div>
                </div>
                <div className="glass p-5">
                  <div className="text-xs text-slate-300/80">Chat built-in</div>
                  <div className="mt-1 text-2xl font-extrabold tracking-tight text-white">Instant</div>
                  <div className="mt-2 text-sm text-slate-200/75">Text + voice messages with spam protection.</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
