"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MessageCircle, Search } from "lucide-react";
import { api, ThreadListItem } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MessagesPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    setError(null);
    api
      .listThreads()
      .then((res) => setThreads(res.items))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load messages";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight text-white">Messages</div>
            <div className="mt-1 text-sm text-slate-300/80">Your conversations with sellers and buyers.</div>
          </div>
          <Link className="btn-primary" href="/listings">
            <Search className="h-4 w-4" />
            Browse listings
          </Link>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="mt-6 grid gap-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[92px]" />)
          ) : threads.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-6 w-6 text-slate-200" />}
              title="No messages yet"
              description="Message a seller from any listing to start a conversation."
              action={
                <Link className="btn-primary" href="/listings">
                  <Search className="h-4 w-4" />
                  Browse listings
                </Link>
              }
            />
          ) : (
            threads.map((t) => (
              <Link
                key={t.id}
                href={`/messages/${t.id}`}
                className="group glass p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glowHover"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                    {t.listing?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.listing.image} alt={t.listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-300/70">No image</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-semibold text-white">
                        {t.otherUser?.displayName || "Conversation"}
                      </div>
                      <span className="chip">Open</span>
                    </div>
                    <div className="mt-1 truncate text-sm text-slate-200/75">{t.listing?.title || ""}</div>
                    <div className="mt-2 truncate text-xs text-slate-300/70">{t.lastMessageText || ""}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
