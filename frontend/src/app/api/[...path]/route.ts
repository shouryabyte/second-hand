import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getApiOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";
  return raw.replace(/\/$/, "");
}

function filteredRequestHeaders(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");
  return headers;
}

function filteredResponseHeaders(headers: Headers) {
  const out = new Headers(headers);
  out.delete("content-encoding");
  out.delete("content-length");
  out.delete("transfer-encoding");
  return out;
}

async function proxy(req: NextRequest, params: Promise<{ path: string[] }>) {
  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_API_BASE_URL (or API_BASE_URL)" },
      { status: 500 }
    );
  }

  const { path } = await params;
  const pathname = "/api/" + (path || []).join("/");
  const url = new URL(req.url);
  const targetUrl = apiOrigin + pathname + url.search;

  const method = req.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers: filteredRequestHeaders(req),
    redirect: "manual",
    // Avoid Next caching proxy responses
    cache: "no-store"
  };

  if (method !== "GET" && method !== "HEAD") {
    const body = await req.arrayBuffer();
    init.body = body.byteLength ? body : undefined;
  }

  const upstream = await fetch(targetUrl, init);

  const resHeaders = filteredResponseHeaders(upstream.headers);
  // Ensure browsers never cache auth responses
  resHeaders.set("Cache-Control", "no-store");

  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: upstream.status,
    headers: resHeaders
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx.params);
}
export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx.params);
}