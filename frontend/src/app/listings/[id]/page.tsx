"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Heart,
  MapPin,
  MessageCircle,
  ReceiptIndianRupee,
  ShieldCheck,
  Star
} from "lucide-react";
import { api, ListingDetail, ListingListItem } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

function locationText(loc: ListingDetail["location"]) {
  const city = loc?.city;
  const state = loc?.state;
  return city || state ? `${city || ""}${city && state ? ", " : ""}${state || ""}` : "Location not set";
}

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<ListingDetail | null>(null);
  const [similar, setSimilar] = useState<ListingListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerBusy, setOfferBusy] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    setError(null);
    setData(null);
    setSimilar([]);
    setActiveImage(0);

    api
      .getListing(id)
      .then((l) => {
        setData(l);
        return api.similarListings(id);
      })
      .then((res) => setSimilar(res.items || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load listing"));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (!getToken()) return;

    api
      .wishlistIds()
      .then((res) => setSaved(res.listingIds.includes(String(id))))
      .catch(() => {
        // ignore
      });
  }, [id]);

  const locText = useMemo(() => (data ? locationText(data.location) : ""), [data]);

  async function toggleSave() {
    if (!id) return;
    if (!getToken()) {
      toast.error("Please login to save items");
      router.push("/auth/login");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (saved) {
        await api.wishlistRemove(String(id));
        setSaved(false);
        toast.success("Removed from saved");
      } else {
        await api.wishlistAdd(String(id));
        setSaved(true);
        toast.success("Saved");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update saved items";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function messageSeller() {
    if (!data) return;
    if (!getToken()) {
      toast.error("Please login to message the seller");
      router.push("/auth/login");
      return;
    }

    setMessaging(true);
    setError(null);
    try {
      const res = await api.createThread({ listingId: data.id });
      router.push(`/messages/${res.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start conversation";
      setError(msg);
      toast.error(msg);
    } finally {
      setMessaging(false);
    }
  }

  async function sendOffer(amount: number) {
    if (!data) return;
    if (!getToken()) {
      toast.error("Please login to make an offer");
      router.push("/auth/login");
      return;
    }

    setOfferBusy(true);
    setError(null);
    try {
      await api.createOffer(data.id, { amount });
      setOfferAmount("");
      toast.success("Offer sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send offer";
      setError(msg);
      toast.error(msg);
    } finally {
      setOfferBusy(false);
    }
  }

  async function buyNow() {
    if (!data) return;
    if (!getToken()) {
      toast.error("Please login to continue");
      router.push("/auth/login");
      return;
    }

    setPayBusy(true);
    setError(null);
    try {
      const key = await api.razorpayPublicKey();
      const order = await api.createRazorpayOrder({ listingId: data.id });
      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: key.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await api.verifyRazorpay({
              transactionId: order.transactionId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success("Payment successful");
            router.push("/transactions");
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Payment verification failed";
            setError(msg);
            toast.error(msg);
          }
        }
      });

      rzp.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setPayBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/listings" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={toggleSave}
            loading={saving}
            leftIcon={<Heart className={cn("h-4 w-4", saved && "fill-current")} />}
          >
            {saved ? "Saved" : "Save"}
          </Button>
          <Link className="btn-secondary" href="/wishlist">
            View saved
          </Link>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      {!error && !data ? (
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-[420px] lg:col-span-7" />
          <Skeleton className="h-[420px] lg:col-span-5" />
        </div>
      ) : null}

      {data ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* UI Upgrade: media gallery */}
          <Card className="lg:col-span-7">
            <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              {data.images?.[activeImage] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.images[activeImage].url}
                  alt={data.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-300/70">No image</div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-950/60 via-transparent to-transparent" />
            </div>

            {data.images && data.images.length > 1 ? (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {data.images.slice(0, 5).map((im, idx) => (
                  <button
                    key={im.publicId}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all duration-300",
                      idx === activeImage ? "ring-2 ring-violet-400/50" : "hover:bg-white/10"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.url} alt={im.originalName || ""} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </Card>

          {/* UI Upgrade: details + actions */}
          <div className="grid gap-6 lg:col-span-5">
            <Card>
              <div className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{data.title}</div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{data.category}</Badge>
                <Badge>Condition: {data.condition.replace("_", " ")}</Badge>
                <Badge>
                  <MapPin className="h-3.5 w-3.5" />
                  {locationText(data.location)}
                </Badge>
              </div>

              <div className="mt-5 text-3xl font-extrabold tracking-tight text-white">
                {data.currency} {data.price}
              </div>

              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-200/80">{data.description}</div>

              <div className="mt-6 grid gap-3">
                <Button onClick={messageSeller} loading={messaging} leftIcon={<MessageCircle className="h-4 w-4" />}>
                  Message seller
                </Button>
                <Button
                  variant="secondary"
                  onClick={buyNow}
                  loading={payBusy}
                  leftIcon={<ReceiptIndianRupee className="h-4 w-4" />}
                >
                  Buy with Razorpay
                </Button>
              </div>

              {data.allowOffers ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">Make an offer</div>
                      <div className="mt-1 text-xs text-slate-300/80">Negotiate instantly with quick offers.</div>
                    </div>
                    <span className="chip">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Protected
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      className="input max-w-[220px]"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      inputMode="numeric"
                      placeholder="Offer amount"
                    />
                    <Button
                      variant="secondary"
                      disabled={offerBusy || !offerAmount.trim()}
                      loading={offerBusy}
                      onClick={() => sendOffer(Number(offerAmount))}
                      type="button"
                    >
                      Send offer
                    </Button>
                    <button
                      className="chip hover:bg-white/10 transition-all duration-300"
                      disabled={offerBusy}
                      onClick={() => sendOffer(Math.max(1, Math.round(data.price * 0.9)))}
                      type="button"
                    >
                      -10%
                    </button>
                    <button
                      className="chip hover:bg-white/10 transition-all duration-300"
                      disabled={offerBusy}
                      onClick={() => sendOffer(Math.max(1, Math.round(data.price * 0.85)))}
                      type="button"
                    >
                      -15%
                    </button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card variant="soft">
              <div className="text-sm font-semibold text-white">Seller</div>
              <div className="mt-2 text-sm text-slate-200/80">
                {data.seller?.displayName || "—"}
                {data.seller?.isVerifiedSeller ? " • Verified" : ""}
              </div>
              <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-200/80">
                <Star className="h-4 w-4 text-amber-300" />
                <span className="font-semibold text-white">{data.seller ? data.seller.ratingAvg.toFixed(1) : "—"}</span>
                <span className="text-slate-300/80">({data.seller?.ratingCount ?? 0})</span>
              </div>
            </Card>
          </div>

          {similar.length ? (
            <div className="lg:col-span-12">
              <div className="mb-3 text-sm font-semibold text-white">Similar items</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((it) => (
                  <Link
                    key={it.id}
                    href={`/listings/${it.id}`}
                    className="group glass overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-glowHover"
                  >
                    <div className="aspect-[16/10] bg-white/5">
                      {it.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.image} alt={it.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-300/70">No image</div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="line-clamp-1 text-sm font-semibold text-white">{it.title}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-base font-extrabold tracking-tight text-white">
                          {it.currency} {it.price}
                        </div>
                        <Badge className="truncate">{it.category}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}