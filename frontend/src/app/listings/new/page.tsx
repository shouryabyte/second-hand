"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

const categories = [
  "Electronics",
  "Furniture",
  "Books",
  "Vehicles",
  "Clothes",
  "Gadgets",
  "Appliances",
  "Other"
];

const conditions = [
  { value: "used", label: "Used" },
  { value: "like_new", label: "Like new" },
  { value: "new", label: "New" }
];

export default function NewListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [condition, setCondition] = useState("used");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("India");
  const [images, setImages] = useState<FileList | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasToken = useMemo(() => Boolean(getToken()), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!hasToken) {
      router.push("/auth/login");
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      form.append("price", price);
      form.append("category", category);
      form.append("condition", condition);
      if (city.trim()) form.append("city", city.trim());
      if (stateName.trim()) form.append("state", stateName.trim());
      if (country.trim()) form.append("country", country.trim());

      if (images) {
        Array.from(images)
          .slice(0, 6)
          .forEach((f) => form.append("images", f));
      }

      const res = await api.createListing(form);
      router.push(`/listings/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="col12">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 20 }}>Create a listing</div>
              <div className="help">Post your item with price, category, location and images.</div>
            </div>
            <Link className="pill" href="/listings">
              Back to browse
            </Link>
          </div>

          {!hasToken ? (
            <div className="error" style={{ marginTop: 12 }}>
              You must be logged in to post. Please login from the top bar.
            </div>
          ) : null}

          <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Samsung monitor 24-inch" />

            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add condition, usage duration, any defects, included accessories..."
            />

            <div className="grid">
              <div className="col6">
                <label>Price (INR)</label>
                <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="e.g. 5500" />
              </div>
              <div className="col6">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col6">
                <label>Condition</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  {conditions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col6">
                <label>Images (up to 6, 2MB each)</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} />
              </div>
            </div>

            <div className="grid" style={{ marginTop: 4 }}>
              <div className="col6">
                <label>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bhubaneswar" />
              </div>
              <div className="col6">
                <label>State</label>
                <input value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="e.g. Odisha" />
              </div>
              <div className="col6">
                <label>Country</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
              </div>
              <div className="col6" style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <button className="btn" disabled={busy || !hasToken}>
                  {busy ? "Posting..." : "Publish"}
                </button>
                <Link className="btn btnSecondary" href="/listings">
                  Cancel
                </Link>
              </div>
            </div>

            {error ? <div className="error">{error}</div> : null}
          </form>
        </div>
      </div>
    </div>
  );
}
