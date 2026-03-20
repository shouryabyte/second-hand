"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  LayoutDashboard,
  LogIn,
  MessageCircle,
  ReceiptIndianRupee,
  Search,
  Sparkles,
  User,
  Plus
} from "lucide-react";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";

function NavLink({
  href,
  active,
  icon,
  children
}: {
  href: string;
  active: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  // UI Upgrade: animated underline + active highlight
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-300",
        active
          ? "bg-white/10 ring-1 ring-white/10 text-white"
          : "text-slate-200 hover:text-white hover:bg-white/5"
      )}
    >
      <span className={cn("text-slate-300 group-hover:text-white", active && "text-white")}>{icon}</span>
      <span>{children}</span>
      <span
        className={cn(
          "pointer-events-none absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-violet-400/0 via-violet-300/60 to-sky-300/0 transition-transform duration-300",
          active ? "scale-x-100" : "group-hover:scale-x-100"
        )}
        aria-hidden
      />
    </Link>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Awaited<ReturnType<typeof api.me>> | null>(null);

  useEffect(() => {
    const update = () => {
      const t = getToken();
      setToken(t);
      if (!t) {
        setMe(null);
        return;
      }
      api
        .me()
        .then(setMe)
        .catch(() => setMe(null));
    };

    update();
    window.addEventListener("auth_token_changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("auth_token_changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const isAdmin = me?.role === "admin";

  const authedLinks = useMemo(() => {
    if (!token) return null;

    return (
      <div className="hidden items-center gap-2 lg:flex">
        <NavLink href="/wishlist" active={pathname.startsWith("/wishlist")} icon={<Heart className="h-4 w-4" />}>
          Saved
        </NavLink>
        <NavLink href="/messages" active={pathname.startsWith("/messages")} icon={<MessageCircle className="h-4 w-4" />}>
          Messages
        </NavLink>
        <NavLink
          href="/transactions"
          active={pathname.startsWith("/transactions")}
          icon={<ReceiptIndianRupee className="h-4 w-4" />}
        >
          Transactions
        </NavLink>
        {isAdmin ? (
          <NavLink href="/admin" active={pathname.startsWith("/admin")} icon={<LayoutDashboard className="h-4 w-4" />}>
            Admin
          </NavLink>
        ) : null}
      </div>
    );
  }, [token, pathname, isAdmin]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bg-900/50 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* UI Upgrade: brand + gradient logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 shadow-lg shadow-violet-500/25 ring-1 ring-white/15">
            <Sparkles className="h-5 w-5 text-white/95" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-white">NexChakra Market</div>
            <div className="text-xs text-slate-300/80">Second-hand marketplace</div>
          </div>
        </Link>

        {/* UI Upgrade: primary navigation */}
        <nav className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <NavLink href="/listings" active={pathname.startsWith("/listings") && !pathname.startsWith("/listings/new")} icon={<Search className="h-4 w-4" />}>
              Browse
            </NavLink>
            <Link
              href="/listings/new"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-300",
                pathname.startsWith("/listings/new")
                  ? "bg-white/10 ring-1 ring-white/10 text-white"
                  : "bg-white/5 ring-1 ring-white/10 text-slate-100 hover:bg-white/10 hover:-translate-y-0.5"
              )}
            >
              <Plus className="h-4 w-4" />
              Sell Item
            </Link>
          </div>

          {authedLinks}

          {/* UI Upgrade: auth/profile CTA with avatar */}
          {token ? (
            <Link
              href="/profile"
              className="ml-1 inline-flex items-center gap-2 rounded-2xl bg-white/5 px-2 py-1.5 ring-1 ring-white/10 transition-all duration-300 hover:bg-white/10"
              aria-label="Profile"
            >
              <Avatar name={me?.displayName} size="sm" />
              <span className="hidden max-w-[140px] truncate text-sm font-semibold text-slate-100 sm:inline">
                {me?.displayName || "Profile"}
              </span>
              <User className="hidden h-4 w-4 text-slate-300 sm:block" />
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="ml-1 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </nav>
      </div>

      {/* UI Upgrade: compact mobile nav */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 pb-3 md:hidden sm:px-6">
        <NavLink href="/listings" active={pathname.startsWith("/listings") && !pathname.startsWith("/listings/new")} icon={<Search className="h-4 w-4" />}>
          Browse Listings
        </NavLink>
        <Link href="/listings/new" className="btn-primary px-4 py-2 text-sm">
          <Plus className="h-4 w-4" />
          Sell Item
        </Link>
      </div>
    </header>
  );
}

