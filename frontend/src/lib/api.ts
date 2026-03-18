import { getToken } from "./auth";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type ApiError = {
  error?: string;
  details?: unknown;
  reason?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    }
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    const message = (data && (data.error || data.reason)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
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

export const api = {
  register: (body: { email?: string; phone?: string; password: string; displayName: string }) =>
    request<{ token: string; user: { id: string; email?: string; phone?: string; displayName: string } }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify(body) }
    ),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; email?: string; phone?: string; displayName: string } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify(body) }
    ),
  requestOtp: (body: { phone: string }) =>
    request<{ ok: true; phone: string; otp: string; expiresInSec: number }>("/api/auth/request-otp", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  verifyOtp: (body: { phone: string; otp: string }) =>
    request<{ token: string; user: { id: string; email?: string; phone?: string; displayName: string } }>(
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
      const message = (data && (data.error || data.reason)) || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data as { id: string };
  }
};

