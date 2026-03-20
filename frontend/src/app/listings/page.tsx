"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  XCircle,
  Plus
} from "lucide-react";
import { api, ListingListItem } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const categories = [
  "",
  "Electronics",
  "Furniture",
  "Books",
  "Vehicles",
  "Clothes",
  "Gadgets",
  "Appliances",
  "Other"
];

const PRICE_CAP = 200000;

function locationText(it: ListingListItem) {
  const city = it.location?.city;
  const state = it.location?.state;
  return city || state ? `${city || ""}${city && state ? ", " : ""}${state || ""}` : "Location not set";
}

export default function ListingsPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [sort, setSort] = useState<"recent" | "price_asc" | "price_desc">("recent");

  const [items, setItems] = useState<ListingListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const minNum = Math.max(0, Math.min(PRICE_CAP, Number(minPrice || 0) || 0));
  const maxNum = Math.max(minNum, Math.min(PRICE_CAP, Number(maxPrice || PRICE_CAP) || PRICE_CAP));

  const query = useMemo(
    () => ({
      q: q.trim() || undefined,
      category: category || undefined,
      minPrice: minPrice.trim() || undefined,
      maxPrice: maxPrice.trim() || undefined,
      city: city.trim() || undefined,
      state: stateName.trim() || undefined,
      sort,
      page: String(page),
      limit: "12"
    }),
    [q, category, minPrice, maxPrice, city, stateName, sort, page]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listListings(query);
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort]);

  useEffect(() => {
    // UI Upgrade: load wishlist state to power the heart icon
    const token = getToken();
    if (!token) {
      setSavedIds(new Set());
      return;
    }

    api
      .wishlistIds()
      .then((res) => setSavedIds(new Set(res.listingIds.map(String))))
      .catch(() => setSavedIds(new Set()));
  }, [page]);

  async function toggleSave(id: string) {
    const token = getToken();
    if (!token) {
      toast.error("Please login to save items");
      return;
    }

    const isSaved = savedIds.has(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (isSaved) {
        await api.wishlistRemove(id);
        toast.success("Removed from saved");
      } else {
        await api.wishlistAdd(id);
        toast.success("Saved");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update saved items");
      // revert
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight text-white">Browse listings</div>
            <div className="mt-1 text-sm text-slate-300/80">Search by keyword and filter by category, price, and location.</div>
          </div>
          <Link href="/listings/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Sell an item
          </Link>
        </div>

        {/* UI Upgrade: modern floating filter panel with icons + sliders */}
        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Keyword</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input pl-9"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="e.g. iPhone, sofa, books"
                  />
                </div>
              </div>

              <div>
                <label className="label">Category</label>
                <div className="relative">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select className="input pl-9" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c || "All"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">City</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-9" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                </div>
              </div>

              <div>
                <label className="label">State</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input pl-9"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Price range</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  inputMode="numeric"
                />
                <input
                  className="input"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  inputMode="numeric"
                />
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs text-slate-300/80">
                  <span>₹0</span>
                  <span>₹{PRICE_CAP.toLocaleString()}</span>
                </div>
                <div className="relative mt-2 h-8">
                  <input
                    type="range"
                    min={0}
                    max={PRICE_CAP}
                    value={minNum}
                    onChange={(e) => {
                      const v = Math.min(Number(e.target.value), maxNum);
                      setMinPrice(String(v));
                    }}
                    className="absolute inset-0 h-8 w-full appearance-none bg-transparent"
                  />
                  <input
                    type="range"
                    min={0}
                    max={PRICE_CAP}
                    value={maxNum}
                    onChange={(e) => {
                      const v = Math.max(Number(e.target.value), minNum);
                      setMaxPrice(String(v));
                    }}
                    className="absolute inset-0 h-8 w-full appearance-none bg-transparent"
                  />
                  <div
                    className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10"
                    aria-hidden
                  />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500/60 to-sky-500/60"
                    style={{
                      left: `${(minNum / PRICE_CAP) * 100}%`,
                      right: `${100 - (maxNum / PRICE_CAP) * 100}%`
                    }}
                    aria-hidden
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-300/80">
                  <span>Min: ₹{minNum.toLocaleString()}</span>
                  <span>Max: ₹{maxNum.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-soft lg:col-span-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <SlidersHorizontal className="h-4 w-4" />
              Controls
            </div>

            <div className="mt-4">
              <label className="label">Sort</label>
              <select className="input" value={sort} onChange={(e) => setSort(e.target.value as any)}>
                <option value="recent">Most recent</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>

            <div className="mt-5 grid gap-3">
              <Button
                onClick={() => {
                  setPage(1);
                  load();
                }}
                loading={loading}
                leftIcon={<Search className="h-4 w-4" />}
              >
                Apply filters
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setQ("");
                  setCategory("");
                  setMinPrice("");
                  setMaxPrice("");
                  setCity("");
                  setStateName("");
                  setSort("recent");
                  setPage(1);
                  setTimeout(load, 0);
                }}
                disabled={loading}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Reset
              </Button>
              <div className="text-xs text-slate-300/80">
                {total ? `${total} results` : loading ? "" : "No results yet"}
              </div>
            </div>

            {error ? <div className="error">{error}</div> : null}
          </div>
        </div>
      </Card>

      {/* UI Upgrade: premium grid cards + skeleton loader + empty state */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-[320px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6 text-slate-200" />}
          title="No listings found"
          description="Try adjusting filters or search for something else."
          action={
            <Link className="btn-primary" href="/listings/new">
              <Plus className="h-4 w-4" />
              Post a listing
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const isSaved = savedIds.has(it.id);
            return (
              <Link
                key={it.id}
                href={`/listings/${it.id}`}
                className={cn(
                  "group glass overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-glowHover",
                  "focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                )}
              >
                <div className="relative aspect-[16/10] w-full bg-white/5">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-300/70">
                      No image
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-950/60 via-transparent to-transparent" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSave(it.id);
                    }}
                    className={cn(
                      "absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ring-white/10 backdrop-blur",
                      isSaved ? "bg-rose-500/20 text-rose-200" : "bg-bg-950/40 text-slate-200 hover:bg-bg-950/55"
                    )}
                    aria-label={isSaved ? "Unsave" : "Save"}
                  >
                    <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
                  </button>
                </div>

                <div className="p-5">
                  <div className="line-clamp-1 text-base font-semibold tracking-tight text-white">{it.title}</div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="text-lg font-extrabold tracking-tight text-white">
                      {it.currency} {it.price}
                    </div>
                    <Badge className="max-w-[50%] truncate">{it.category}</Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-200/70">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{locationText(it)}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-300" />
                        <span className="font-semibold text-slate-100">{(it.seller?.ratingAvg ?? 0).toFixed(1)}</span>
                        <span className="text-slate-300/80">({it.seller?.ratingCount ?? 0})</span>
                      </span>
                      {it.seller?.isVerifiedSeller ? <span className="chip">Verified</span> : null}
                    </div>
                    <span className="truncate">{it.seller?.displayName || "—"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* UI Upgrade: pagination controls */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
          Prev
        </Button>
        <div className="chip">Page {page}</div>
        <Button variant="secondary" disabled={loading || page * 12 >= total} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
