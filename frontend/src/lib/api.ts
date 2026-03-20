import { getToken } from "./auth";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type ApiError = {
  error?: string;
  details?: any;
  reason?: string;
  fields?: Record<string, string[]>;
  formErrors?: string[];
};

function formatApiError(data: ApiError, fallback: string) {
  const base = (data && (data.error || data.reason)) || fallback;

  const fields = data?.fields || data?.details?.fieldErrors;
  const formErrors = data?.formErrors || data?.details?.formErrors;

  const parts: string[] = [];

  if (fields && typeof fields === "object" && !Array.isArray(fields)) {
    Object.entries(fields as Record<string, unknown>).forEach(([k, v]) => {
      const msgList = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
      const clean = msgList.map((x) => String(x)).filter(Boolean);
      if (clean.length === 0) return;
      parts.push(`${k}: ${clean.join(", ")}`);
    });
  }

  if (formErrors && Array.isArray(formErrors) && formErrors.length) {
    parts.push(...formErrors.map((x: any) => String(x)).filter(Boolean));
  }

  return parts.length ? `${base} — ${parts.join(" · ")}` : base;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {})
      }
    });

    const data = (await res.json().catch(() => ({}))) as T & ApiError;
    if (!res.ok) {
      const message = formatApiError(data, `Request failed (${res.status})`);
      throw new Error(message);
    }
    return data as T;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`Request timed out. Check NEXT_PUBLIC_API_BASE_URL (${baseUrl}).`);
    }
    if (err instanceof TypeError) {
      throw new Error(
        `Backend not reachable. Check NEXT_PUBLIC_API_BASE_URL (${baseUrl}) and ensure the backend is running.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
export type ListingListItem = {
  id: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  location: { city: string | null; state: string | null; country: string | null; lat: number | null; lng: number | null };
  image: string | null;
  createdAt: string;
  seller: {
    id: string;
    displayName: string;
    isVerifiedSeller: boolean;
    ratingAvg: number;
    ratingCount: number;
  } | null;
};

export type ListingDetail = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  location: { city: string | null; state: string | null; country: string | null; lat: number | null; lng: number | null };
  images: { url: string; publicId: string; originalName: string | null; mimeType: string; size: number }[];
  allowOffers: boolean;
  createdAt: string;
  seller: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    isVerifiedSeller: boolean;
    ratingAvg: number;
    ratingCount: number;
  } | null;
};

export type ThreadListItem = {
  id: string;
  listing: {
    id: string;
    title: string;
    price: number;
    currency: string;
    category: string;
    image: string | null;
    location: any;
  } | null;
  otherUser: { id: string; displayName: string } | null;
  lastMessageAt: string | null;
  lastMessageText: string | null;
};

export type ThreadMessage = {
  id: string;
  fromUserId: string;
  type: "text" | "voice";
  text?: string | null;
  voiceUrl?: string | null;
  createdAt: string;
};

export type AdminStats = {
  users: number;
  listingsActive: number;
  listingsSuspicious: number;
  threads: number;
  messages: number;
  transactionsPaid: number;
  revenue: { currency: string; total: number; count: number }[];
};

export const api = {
  register: (body: { email?: string; phone?: string; password: string; displayName: string }) =>
    request<{ token: string; user: { id: string; email?: string; phone?: string; displayName: string; role: string } }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify(body) }
    ),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; email?: string; phone?: string; displayName: string; role: string } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify(body) }
    ),

  requestOtp: (body: { phone: string }) =>
    request<{ ok: true; phone: string; otp: string; expiresInSec: number }>("/api/auth/request-otp", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  verifyOtp: (body: { phone: string; otp: string }) =>
    request<{ token: string; user: { id: string; email?: string; phone?: string; displayName: string; role: string } }>(
      "/api/auth/verify-otp",
      { method: "POST", body: JSON.stringify(body) }
    ),

  me: () =>
    request<{
      id: string;
      email: string | null;
      phone: string | null;
      displayName: string;
      role: string;
      isVerifiedSeller: boolean;
      ratingAvg: number;
      ratingCount: number;
      createdAt: string;
    }>("/api/me", { method: "GET" }),

  listListings: (query?: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    city?: string;
    state?: string;
    country?: string;
    sort?: string;
    page?: string;
    limit?: string;
  }) => {
    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([k, v]) => {
      if (v != null && String(v).trim() !== "") params.set(k, String(v));
    });
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<{ page: number; limit: number; total: number; items: ListingListItem[] }>(`/api/listings${suffix}`, {
      method: "GET"
    });
  },

  getListing: (id: string) => request<ListingDetail>(`/api/listings/${encodeURIComponent(id)}`, { method: "GET" }),

  similarListings: (id: string) => request<{ items: ListingListItem[] }>(`/api/listings/${encodeURIComponent(id)}/similar`, { method: "GET" }),

  createListing: async (form: FormData) => {
    const token = getToken();
    const res = await fetch(`${baseUrl}/api/listings`, {
      method: "POST",
      body: form,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const data = (await res.json().catch(() => ({}))) as { id?: string } & ApiError;
    if (!res.ok) {
      const message = formatApiError(data, `Request failed (${res.status})`);
      throw new Error(message);
    }
    return data as { id: string };
  },

  listThreads: () => request<{ items: ThreadListItem[] }>("/api/threads", { method: "GET" }),

  createThread: (body: { listingId: string }) =>
    request<{ id: string }>("/api/threads", { method: "POST", body: JSON.stringify(body) }),

  getThreadMessages: (threadId: string) =>
    request<{ threadId: string; messages: ThreadMessage[] }>(`/api/threads/${encodeURIComponent(threadId)}/messages`, {
      method: "GET"
    }),

  sendThreadMessage: (threadId: string, body: { text: string }) =>
    request<ThreadMessage>(`/api/threads/${encodeURIComponent(threadId)}/messages`, {
      method: "POST",
      body: JSON.stringify(body)
    }),

  sendVoiceMessage: async (threadId: string, voice: Blob) => {
    const token = getToken();
    const form = new FormData();
    form.append("voice", voice, "voice.webm");

    const res = await fetch(`${baseUrl}/api/threads/${encodeURIComponent(threadId)}/voice`, {
      method: "POST",
      body: form,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const data = (await res.json().catch(() => ({}))) as ThreadMessage & ApiError;
    if (!res.ok) {
      const message = formatApiError(data, `Request failed (${res.status})`);
      throw new Error(message);
    }
    return data as ThreadMessage;
  },

  wishlistIds: () => request<{ listingIds: string[] }>("/api/wishlist/ids", { method: "GET" }),

  wishlist: () => request<{ items: ListingListItem[] }>("/api/wishlist", { method: "GET" }),

  wishlistAdd: (listingId: string) => request<{ ok: true }>(`/api/wishlist/${encodeURIComponent(listingId)}`, { method: "POST" }),

  wishlistRemove: (listingId: string) =>
    request<{ ok: true }>(`/api/wishlist/${encodeURIComponent(listingId)}`, { method: "DELETE" }),

  createOffer: (listingId: string, body: { amount: number; message?: string }) =>
    request<{ id: string }>(`/api/offers/${encodeURIComponent(listingId)}`, { method: "POST", body: JSON.stringify(body) }),

  offersReceived: () => request<{ items: any[] }>("/api/offers/received", { method: "GET" }),
  offersSent: () => request<{ items: any[] }>("/api/offers/sent", { method: "GET" }),

  acceptOffer: (offerId: string) => request<{ ok: true }>(`/api/offers/${encodeURIComponent(offerId)}/accept`, { method: "POST" }),
  rejectOffer: (offerId: string) => request<{ ok: true }>(`/api/offers/${encodeURIComponent(offerId)}/reject`, { method: "POST" }),

  aiPriceSuggest: (body: any) => request<{ text: string }>("/api/ai/price-suggest", { method: "POST", body: JSON.stringify(body) }),
  aiDescription: (body: any) => request<{ text: string }>("/api/ai/description", { method: "POST", body: JSON.stringify(body) }),

  razorpayPublicKey: () => request<{ keyId: string }>("/api/payments/public-key", { method: "GET" }),
  createRazorpayOrder: (body: { listingId: string }) =>
    request<{ transactionId: string; orderId: string; amount: number; currency: string; name: string; description: string }>(
      "/api/payments/create-order",
      { method: "POST", body: JSON.stringify(body) }
    ),
  verifyRazorpay: (body: any) => request<{ ok: true }>("/api/payments/verify", { method: "POST", body: JSON.stringify(body) }),
  myTransactions: () => request<{ items: any[] }>("/api/payments/mine", { method: "GET" }),

  adminStats: () => request<AdminStats>("/api/admin/stats", { method: "GET" }),
  adminUsers: () => request<{ items: any[] }>("/api/admin/users", { method: "GET" }),
  adminVerifySeller: (id: string, value: boolean) =>
    request<{ ok: true }>(`/api/admin/users/${encodeURIComponent(id)}/verify-seller`, { method: "POST", body: JSON.stringify({ value }) }),
  adminSetRole: (id: string, role: "admin" | "user") =>
    request<{ ok: true }>(`/api/admin/users/${encodeURIComponent(id)}/role`, { method: "POST", body: JSON.stringify({ role }) }),
  adminListings: () => request<{ items: any[] }>("/api/admin/listings", { method: "GET" }),
  adminListingStatus: (id: string, status: string) =>
    request<{ ok: true }>(`/api/admin/listings/${encodeURIComponent(id)}/status`, { method: "POST", body: JSON.stringify({ status }) }),
  adminClearSuspicious: (id: string) =>
    request<{ ok: true }>(`/api/admin/listings/${encodeURIComponent(id)}/clear-suspicious`, { method: "POST" }),
  adminTransactions: () => request<{ items: any[] }>("/api/admin/transactions", { method: "GET" }),
  adminSpamMessages: () => request<{ items: any[] }>("/api/admin/spam-messages", { method: "GET" })
};
