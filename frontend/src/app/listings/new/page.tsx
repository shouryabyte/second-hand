"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, Wand2 } from "lucide-react";

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
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [condition, setCondition] = useState("used");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("India");
  const [images, setImages] = useState<FileList | null>(null);

  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiSuggestedPrice, setAiSuggestedPrice] = useState<number | null>(null);
  // UX Fix: client-side validation mirrors backend rules (so you know what is invalid).
  const titleOk = title.trim().length >= 3;
  const descriptionOk = description.trim().length >= 10;
  const priceValue = Number(price);
  const priceOk = Number.isFinite(priceValue) && priceValue >= 0;
  const canPublish = titleOk && descriptionOk && priceOk && !busy;

  useEffect(() => {
    // UI Upgrade: protect listing creation behind auth
    if (!getToken()) router.push("/auth/login");
  }, [router]);
  function formatAiPriceSuggestion(raw: string): { text: string; suggested: number | null } {
    const cleaned = String(raw || "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = cleaned.slice(start, end + 1);
      try {
        const obj = JSON.parse(jsonStr);
        const min = Number(obj?.min);
        const max = Number(obj?.max);
        const suggested = Number(obj?.suggested);
        const reasoning = String(obj?.reasoning || "").trim();

        const lines: string[] = [];
        if (Number.isFinite(suggested)) lines.push(`Suggested price: Ã¢â€šÂ¹${Math.round(suggested).toLocaleString()}`);
        if (Number.isFinite(min) && Number.isFinite(max)) {
          lines.push(`Expected range: Ã¢â€šÂ¹${Math.round(min).toLocaleString()} Ã¢â‚¬â€œ Ã¢â€šÂ¹${Math.round(max).toLocaleString()}`);
        }
        if (reasoning) {
          lines.push("");
          lines.push("Why:");
          lines.push(`- ${reasoning.replace(/\n+/g, " ")}`);
        }

        return { text: lines.join("\n"), suggested: Number.isFinite(suggested) ? Math.round(suggested) : null };
      } catch {
        // ignore
      }
    }

    return { text: cleaned, suggested: null };
  }

  async function suggestPrice() {
    setError(null);
    setAiHint(null);
    setAiSuggestedPrice(null);
    setAiBusy(true);
    try {
      const res = await api.aiPriceSuggest({
        title,
        category,
        condition,
        description,
        city,
        state: stateName
      });
      const formatted = formatAiPriceSuggestion(res.text);
      setAiHint(formatted.text);
      setAiSuggestedPrice(formatted.suggested);
      toast.success("Price suggestion ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to suggest price";
      setError(msg);
      toast.error(msg);
    } finally {
      setAiBusy(false);
    }
  }

  async function generateDescription() {
    setError(null);
    setAiHint(null);
    setAiSuggestedPrice(null);
    setAiBusy(true);
    try {
      const res = await api.aiDescription({ title, category, condition, city, state: stateName, notes });
      setDescription(res.text);
      toast.success("Description generated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate description";
      setError(msg);
      toast.error(msg);
    } finally {
      setAiBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!getToken()) {
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
      toast.success("Listing published");
      router.push(`/listings/${res.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create listing";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight text-white">Create a listing</div>
            <div className="mt-1 text-sm text-slate-300/80">Post your item with price, category, location and images.</div>
          </div>
          <Link className="btn-secondary" href="/listings">
            Back to browse
          </Link>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Samsung monitor 24-inch"
                required
              />
              {!titleOk ? <div className="mt-2 text-xs text-slate-300/70">Title must be at least 3 characters.</div> : null}
            </div>

            <div>
              <label className="label">Seller notes (optional)</label>
              <input
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 2 years old, minor scratch"
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[140px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add condition, usage duration, any defects, included accessories..."
              required
            />
            {!descriptionOk ? (
              <div className="mt-2 text-xs text-slate-300/70">Description must be at least 10 characters.</div>
            ) : null}

            {/* UI Upgrade: AI assist actions */}
            <div className="mt-3 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                loading={aiBusy}
                onClick={suggestPrice}
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                AI price suggestion
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={aiBusy}
                onClick={generateDescription}
                leftIcon={<Wand2 className="h-4 w-4" />}
              >
                AI description
              </Button>
            </div>

            {aiHint ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-200/80">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Badge>AI Hint</Badge>
                  </div>
                  {aiSuggestedPrice != null ? (
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2 text-xs"
                      onClick={() => setPrice(String(aiSuggestedPrice))}
                    >
                      Use Ã¢â€šÂ¹{aiSuggestedPrice.toLocaleString()}
                    </button>
                  ) : null}
                </div>
                <div className="whitespace-pre-wrap">{aiHint}</div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="label">Price (INR)</label>
              <input
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 5500"
                required
              />
              {!priceOk ? <div className="mt-2 text-xs text-slate-300/70">Price must be a valid number.</div> : null}
            </div>

            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Condition</label>
              <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
                {conditions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Images (up to 6)</label>
              <input className="input py-2" type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} />
              <div className="mt-2 text-xs text-slate-300/70">PNG/JPG/WebP recommended. First image becomes thumbnail.</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="label">City</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bhubaneswar" />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="e.g. Odisha" />
            </div>
            <div>
              <label className="label">Country</label>
              <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <Button className="min-w-[140px]" loading={busy} disabled={!canPublish}>
                Publish
              </Button>
              <Link className="btn-secondary" href="/listings">
                Cancel
              </Link>
            </div>
          </div>

          {error ? <div className="error">{error}</div> : null}
        </form>
      </Card>
    </div>
  );
}
