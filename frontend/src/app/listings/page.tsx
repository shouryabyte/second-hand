"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, ListingListItem } from "@/lib/api";

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

  return (
    <div className="grid">
      <div className="col12">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 20 }}>Browse listings</div>
              <div className="help">Search by keyword and filter by category, price, and location.</div>
            </div>
            <Link className="btn" href="/listings/new">
              Sell an item
            </Link>
          </div>

          <div className="grid" style={{ marginTop: 14 }}>
            <div className="col6">
              <label>Keyword</label>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. iPhone, sofa, books" />
            </div>
            <div className="col6">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c || "All"}
                  </option>
                ))}
              </select>
            </div>

            <div className="col6">
              <label>Price range</label>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" inputMode="numeric" />
                <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" inputMode="numeric" />
              </div>
            </div>

            <div className="col6">
              <label>Location</label>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                <input value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" />
              </div>
            </div>

            <div className="col6">
              <label>Sort</label>
              <select value={sort} onChange={(e) => setSort(e.target.value as any)}>
                <option value="recent">Most recent</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>

            <div className="col6" style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <button
                className="btn"
                onClick={() => {
                  setPage(1);
                  load();
                }}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                className="btn btnSecondary"
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
              >
                Reset
              </button>
              <div className="help">{total ? `${total} results` : loading ? "" : "No results yet"}</div>
            </div>
          </div>

          {error ? <div className="error">{error}</div> : null}
        </div>
      </div>

      <div className="col12">
        <div className="listGrid">
          {items.map((it) => (
            <Link key={it.id} className="listCard" href={`/listings/${it.id}`}>
              <div className="thumb">
                {it.image ? <img src={it.image} alt={it.title} /> : <span>No image</span>}
              </div>
              <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>{it.title}</div>
              <div className="metaRow">
                <div className="price">
                  {it.currency} {it.price}
                </div>
                <span className="badge">{it.category}</span>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                {(it.location?.city || it.location?.state) ? `${it.location.city || ""}${it.location.city && it.location.state ? ", " : ""}${it.location.state || ""}` : "Location not set"}
              </div>
              <div style={{ color: "var(--muted2)", fontSize: 12 }}>
                Seller: {it.seller?.displayName || "—"}{it.seller?.isVerifiedSeller ? " • Verified" : ""}
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <button className="btn btnSecondary" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <div className="pill">Page {page}</div>
          <button
            className="btn btnSecondary"
            disabled={loading || page * 12 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
