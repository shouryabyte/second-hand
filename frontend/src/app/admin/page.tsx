"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BarChart3,
  Flag,
  Home,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Users,
  ReceiptIndianRupee,
  MessageSquareWarning
} from "lucide-react";
import { api, AdminStats } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

type Tab = "overview" | "users" | "listings" | "transactions" | "spam";

function TabButton({
  active,
  onClick,
  icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  // UI Upgrade: modern tabs with active glow
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-300",
        active
          ? "bg-white/10 ring-1 ring-white/15 text-white"
          : "bg-white/5 ring-1 ring-white/10 text-slate-200 hover:bg-white/10"
      )}
    >
      <span className={cn("text-slate-300", active && "text-white")}>{icon}</span>
      {children}
    </button>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [meRole, setMeRole] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [spam, setSpam] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canView = useMemo(() => meRole === "admin", [meRole]);

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    api
      .me()
      .then((me) => {
        setMeRole(me.role);
        if (me.role !== "admin") return;
        setLoading(true);
        return api
          .adminStats()
          .then(setStats)
          .catch((err) => {
            const msg = err instanceof Error ? err.message : "Failed to load";
            setError(msg);
            toast.error(msg);
          })
          .finally(() => setLoading(false));
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load";
        setError(msg);
        toast.error(msg);
      });
  }, [router]);

  async function loadTab(next: Tab) {
    setTab(next);
    setError(null);
    setLoading(true);
    try {
      if (next === "overview") {
        setStats(await api.adminStats());
      } else if (next === "users") {
        setUsers((await api.adminUsers()).items);
      } else if (next === "listings") {
        setListings((await api.adminListings()).items);
      } else if (next === "transactions") {
        setTransactions((await api.adminTransactions()).items);
      } else if (next === "spam") {
        setSpam((await api.adminSpamMessages()).items);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function toggleVerifySeller(id: string, value: boolean) {
    setError(null);
    try {
      await api.adminVerifySeller(id, value);
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, isVerifiedSeller: value } : x)));
      toast.success(value ? "Seller verified" : "Seller unverified");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      toast.error(msg);
    }
  }

  async function setListingStatus(id: string, status: string) {
    setError(null);
    try {
      await api.adminListingStatus(id, status);
      setListings((l) => l.map((x) => (x.id === id ? { ...x, status } : x)));
      toast.success("Listing updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      toast.error(msg);
    }
  }

  async function clearSuspicious(id: string) {
    setError(null);
    try {
      await api.adminClearSuspicious(id);
      setListings((l) => l.map((x) => (x.id === id ? { ...x, isSuspicious: false, fraudReasons: [] } : x)));
      toast.success("Flag cleared");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      toast.error(msg);
    }
  }

  if (meRole && meRole !== "admin") {
    return (
      <div className="grid gap-6">
        <Card>
          <div className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
            <LayoutDashboard className="h-5 w-5" />
            Admin
          </div>
          <div className="mt-3 text-sm text-slate-300/80">You do not have access.</div>
          <div className="mt-6">
            <Link className="btn-secondary" href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
              <LayoutDashboard className="h-5 w-5" />
              Admin panel
            </div>
            <div className="mt-1 text-sm text-slate-300/80">Moderation and platform analytics.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link className="btn-primary" href="/listings">
              <ListChecks className="h-4 w-4" />
              Browse
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <TabButton active={tab === "overview"} onClick={() => loadTab("overview")} icon={<BarChart3 className="h-4 w-4" />}>
            Overview
          </TabButton>
          <TabButton active={tab === "users"} onClick={() => loadTab("users")} icon={<Users className="h-4 w-4" />}>
            Users
          </TabButton>
          <TabButton active={tab === "listings"} onClick={() => loadTab("listings")} icon={<Flag className="h-4 w-4" />}>
            Listings
          </TabButton>
          <TabButton
            active={tab === "transactions"}
            onClick={() => loadTab("transactions")}
            icon={<ReceiptIndianRupee className="h-4 w-4" />}
          >
            Transactions
          </TabButton>
          <TabButton
            active={tab === "spam"}
            onClick={() => loadTab("spam")}
            icon={<MessageSquareWarning className="h-4 w-4" />}
          >
            Spam
          </TabButton>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {loading ? <div className="mt-4 text-sm text-slate-300/80">Loading…</div> : null}

        {tab === "overview" ? (
          !stats && loading ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-[170px]" />
              <Skeleton className="h-[170px]" />
            </div>
          ) : stats ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="glass-soft p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4" />
                  Usage
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-200/80">
                  <div>Users: {stats.users}</div>
                  <div>Active listings: {stats.listingsActive}</div>
                  <div>Suspicious listings: {stats.listingsSuspicious}</div>
                  <div>Threads: {stats.threads}</div>
                  <div>Messages: {stats.messages}</div>
                </div>
              </div>

              <div className="glass-soft p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ReceiptIndianRupee className="h-4 w-4" />
                  Revenue
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-200/80">
                  <div>Paid transactions: {stats.transactionsPaid}</div>
                  {stats.revenue.map((r) => (
                    <div key={r.currency}>
                      {r.currency}: {r.total} ({r.count})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null
        ) : null}

        {tab === "users" ? (
          <div className="mt-6 grid gap-3">
            {loading && users.length === 0 ? <Skeleton className="h-[96px]" /> : null}
            {users.map((u) => (
              <div key={u.id} className="glass-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{u.displayName}</div>
                    <div className="mt-1 text-sm text-slate-200/75">{u.email || u.phone || "—"}</div>
                    <div className="mt-1 text-xs text-slate-300/70">Role: {u.role}</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => toggleVerifySeller(u.id, !u.isVerifiedSeller)}
                  >
                    {u.isVerifiedSeller ? "Unverify seller" : "Verify seller"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "listings" ? (
          <div className="mt-6 grid gap-3">
            {loading && listings.length === 0 ? <Skeleton className="h-[96px]" /> : null}
            {listings.map((l) => (
              <div key={l.id} className="glass-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{l.title}</div>
                    <div className="mt-1 text-sm text-slate-200/75">
                      {l.currency} {l.price} · Status: <span className="font-semibold text-white">{l.status}</span>
                    </div>
                    {l.isSuspicious ? (
                      <div className="mt-2 text-sm text-rose-200">
                        Suspicious: {(l.fraudReasons || []).join(", ")}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button className="btn-secondary" onClick={() => setListingStatus(l.id, "active")}>
                      Active
                    </button>
                    <button className="btn-secondary" onClick={() => setListingStatus(l.id, "removed")}>
                      Remove
                    </button>
                    {l.isSuspicious ? (
                      <button className="btn-secondary" onClick={() => clearSuspicious(l.id)}>
                        Clear flag
                      </button>
                    ) : null}
                    <Link className="btn-ghost" href={`/listings/${l.id}`}>
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "transactions" ? (
          <div className="mt-6 grid gap-3">
            {loading && transactions.length === 0 ? <Skeleton className="h-[96px]" /> : null}
            {transactions.map((t) => (
              <div key={t.id} className="glass-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{t.listing?.title || "Transaction"}</div>
                    <div className="mt-1 text-sm text-slate-200/75">
                      {t.currency} {t.amount} · {t.status}
                    </div>
                  </div>
                  <Badge>{new Date(t.createdAt).toLocaleString()}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "spam" ? (
          <div className="mt-6 grid gap-3">
            {loading && spam.length === 0 ? <Skeleton className="h-[96px]" /> : null}
            {spam.map((m) => (
              <div key={m.id} className="glass-soft p-4">
                <div className="text-sm font-semibold text-white">Spam message</div>
                <div className="mt-2 text-sm text-slate-200/75">{m.text}</div>
                <div className="mt-2 text-xs text-slate-300/70">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : null}

        {!canView && !meRole ? <div className="mt-4 text-sm text-slate-300/80">Loading…</div> : null}
      </Card>
    </div>
  );
}