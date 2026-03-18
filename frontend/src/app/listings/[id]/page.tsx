"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, ListingDetail } from "@/lib/api";

function sanitizePhone(phone: string) {
  return phone.replace(/[^0-9+]/g, "");
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<ListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setError(null);
    setData(null);
    api
      .getListing(id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load listing"));
  }, [id]);

  const contact = useMemo(() => {
    if (!data?.seller) return null;
    if (data.seller.phone) {
      return { type: "tel" as const, href: `tel:${sanitizePhone(data.seller.phone)}`, label: "Call seller" };
    }
    if (data.seller.email) {
      const subject = encodeURIComponent(`Interested in: ${data.title}`);
      return { type: "email" as const, href: `mailto:${data.seller.email}?subject=${subject}`, label: "Email seller" };
    }
    return null;
  }, [data]);

  return (
    <div className="grid">
      <div className="col12">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <Link className="pill" href="/listings">
              ← Back
            </Link>
            <span className="badge">Listing</span>
          </div>

          {error ? <div className="error">{error}</div> : null}
          {!error && !data ? <div className="help" style={{ marginTop: 12 }}>Loading...</div> : null}

          {data ? (
            <div style={{ marginTop: 12 }}>
              <div className="grid">
                <div className="col6">
                  <div className="thumb" style={{ aspectRatio: "16 / 11" }}>
                    {data.images && data.images[0] ? <img src={data.images[0].url} alt={data.title} /> : <span>No image</span>}
                  </div>
                  {data.images && data.images.length > 1 ? (
                    <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                      {data.images.slice(1, 6).map((im) => (
                        <div key={im.publicId} className="thumb" style={{ width: 110, aspectRatio: "1 / 1" }}>
                          <img src={im.url} alt="" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="col6">
                  <div style={{ fontWeight: 950, fontSize: 26, letterSpacing: "-0.03em" }}>{data.title}</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span className="badge">{data.category}</span>
                    <span className="badge">Condition: {data.condition.replace("_", " ")}</span>
                    <span className="badge">
                      {data.location.city || data.location.state
                        ? `${data.location.city || ""}${data.location.city && data.location.state ? ", " : ""}${data.location.state || ""}`
                        : "Location not set"}
                    </span>
                  </div>

                  <div style={{ marginTop: 14 }} className="price">
                    {data.currency} {data.price}
                  </div>

                  <div style={{ marginTop: 14, color: "var(--muted)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {data.description}
                  </div>

                  <div className="cardSoft" style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 900 }}>Seller</div>
                    <div className="help" style={{ marginTop: 6 }}>
                      {data.seller?.displayName || "—"}
                      {data.seller?.isVerifiedSeller ? " • Verified" : ""}
                    </div>
                    <div className="help">Rating: {data.seller ? `${data.seller.ratingAvg} (${data.seller.ratingCount})` : "—"}</div>

                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {contact ? (
                        <a className="btn" href={contact.href}>
                          {contact.label}
                        </a>
                      ) : (
                        <button className="btn" disabled>
                          Contact seller
                        </button>
                      )}
                      <Link className="btn btnSecondary" href="/profile">
                        Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

