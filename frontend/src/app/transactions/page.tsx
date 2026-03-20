"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ReceiptIndianRupee, Search } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

export default function TransactionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    api
      .myTransactions()
      .then((res) => setItems(res.items))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load transactions";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight text-white">Transactions</div>
            <div className="mt-1 text-sm text-slate-300/80">Your purchases and sales.</div>
          </div>
          <Link className="btn-primary" href="/listings">
            <Search className="h-4 w-4" />
            Browse
          </Link>
        </div>

        {error ? <div className="error">{error}</div> : null}
      </Card>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ReceiptIndianRupee className="h-6 w-6 text-slate-200" />}
          title="No transactions yet"
          description="Buy an item with Razorpay to see it here."
          action={
            <Link className="btn-primary" href="/listings">
              <Search className="h-4 w-4" />
              Browse listings
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {items.map((t) => (
            <div key={t.id} className="glass p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{t.listing?.title || "Listing"}</div>
                  <div className="mt-1 text-sm text-slate-200/80">
                    {t.currency} {t.amount} · <span className="font-semibold">{t.status}</span>
                  </div>
                </div>
                <Badge>{new Date(t.createdAt).toLocaleString()}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}