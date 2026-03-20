"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BadgeCheck, LogOut, Search, Star, User2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

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
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load profile";
        setError(msg);
        toast.error(msg);
      });
  }, [router]);

  function logout() {
    clearToken();
    toast.success("Logged out");
    router.push("/");
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight text-white">Your profile</div>
            <div className="mt-1 text-sm text-slate-300/80">Account details, reputation and quick actions.</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/listings">
              <Search className="h-4 w-4" />
              Browse
            </Link>
            <Link className="btn-primary" href="/listings/new">
              <Plus className="h-4 w-4" />
              Sell
            </Link>
            <Button variant="danger" onClick={logout} leftIcon={<LogOut className="h-4 w-4" />}>
              Logout
            </Button>
          </div>
        </div>

        {error ? <div className="error">{error}</div> : null}
      </Card>

      {!error && !me ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[220px] lg:col-span-2" />
          <Skeleton className="h-[220px]" />
        </div>
      ) : null}

      {me ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* UI Upgrade: premium profile card */}
          <Card className="lg:col-span-2">
            <div className="flex flex-wrap items-start gap-4">
              <Avatar name={me.displayName} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-2xl font-extrabold tracking-tight text-white">{me.displayName}</div>
                  {me.isVerifiedSeller ? (
                    <span className="chip">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified Seller
                    </span>
                  ) : null}
                  {me.role === "admin" ? <Badge>Admin</Badge> : <Badge>User</Badge>}
                </div>
                <div className="mt-3 grid gap-1 text-sm text-slate-200/80">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-slate-300/80">Email:</span>
                    <span className="font-semibold text-slate-100">{me.email || "—"}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-slate-300/80">Phone:</span>
                    <span className="font-semibold text-slate-100">{me.phone || "—"}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-slate-300/80">Joined:</span>
                    <span className="font-semibold text-slate-100">{new Date(me.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* UI Upgrade: stats cards */}
          <div className="grid gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-300/80">Reputation</div>
                  <div className="mt-1 text-2xl font-extrabold tracking-tight text-white">{me.ratingAvg.toFixed(1)}</div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <Star className="h-5 w-5 text-amber-300" />
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-200/75">Based on {me.ratingCount} reviews</div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-300/80">Account</div>
                  <div className="mt-1 text-lg font-extrabold tracking-tight text-white">{me.role}</div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <User2 className="h-5 w-5 text-slate-200" />
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-200/75">
                Verified seller: <span className="font-semibold text-slate-100">{me.isVerifiedSeller ? "Yes" : "No"}</span>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}