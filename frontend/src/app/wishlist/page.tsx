"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HeartOff, Search, Trash2 } from "lucide-react";
import { api, ListingListItem } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<ListingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.wishlist();
      setItems(res.items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load wishlist";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function remove(id: string) {
    try {
      await api.wishlistRemove(id);
      setItems((x) => x.filter((i) => i.id !== id));
      toast.success("Removed from saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight text-white">Saved items</div>
            <div className="mt-1 text-sm text-slate-300/80">Listings you saved for later.</div>
          </div>
          <Link className="btn-primary" href="/listings">
            <Search className="h-4 w-4" />
            Browse listings
          </Link>
        </div>

        {error ? <div className="error">{error}</div> : null}
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-[310px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<HeartOff className="h-6 w-6 text-slate-200" />}
          title="No saved items"
          description="Browse listings and tap the heart to save items for later."
          action={
            <Link className="btn-primary" href="/listings">
              <Search className="h-4 w-4" />
              Browse listings
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="glass overflow-hidden p-0">
              <Link href={`/listings/${it.id}`} className="block">
                <div className="aspect-[16/10] bg-white/5">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-300/70">No image</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="line-clamp-1 text-base font-semibold tracking-tight text-white">{it.title}</div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="text-lg font-extrabold tracking-tight text-white">
                      {it.currency} {it.price}
                    </div>
                    <Badge className="truncate">{it.category}</Badge>
                  </div>
                </div>
              </Link>
              <div className="border-t border-white/10 p-4">
                <Button
                  variant="secondary"
                  onClick={() => remove(it.id)}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
