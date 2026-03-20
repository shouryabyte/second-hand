"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Mic, Send, Square, ChevronLeft, Search } from "lucide-react";
import { api, ThreadMessage } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ThreadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const threadId = params?.id;

  const [meId, setMeId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const canSend = useMemo(() => text.trim().length > 0 && !sending, [text, sending]);

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([api.me(), api.getThreadMessages(String(threadId))])
      .then(([me, res]) => {
        setMeId(me.id);
        setMessages(res.messages);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load conversation";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [router, threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const msg = text.trim();
    if (!msg || !threadId) return;

    setSending(true);
    setError(null);
    try {
      const created = await api.sendThreadMessage(String(threadId), { text: msg });
      setMessages((m) => [...m, created]);
      setText("");
    } catch (err) {
      const msg2 = err instanceof Error ? err.message : "Failed to send";
      setError(msg2);
      toast.error(msg2);
    } finally {
      setSending(false);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
          const created = await api.sendVoiceMessage(String(threadId), blob);
          setMessages((m) => [...m, created]);
          toast.success("Voice message sent");
        } catch (err) {
          const msg2 = err instanceof Error ? err.message : "Failed to send voice message";
          setError(msg2);
          toast.error(msg2);
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          setRecording(false);
        }
      };

      mr.start();
      setRecording(true);
      toast.success("Recording…");
    } catch (err) {
      const msg2 = err instanceof Error ? err.message : "Microphone permission denied";
      setError(msg2);
      toast.error(msg2);
      setRecording(false);
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    try {
      mr.stop();
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/messages" className="btn-ghost">
          <ChevronLeft className="h-4 w-4" />
          Back to messages
        </Link>
        <Link href="/listings" className="btn-secondary">
          <Search className="h-4 w-4" />
          Browse
        </Link>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <Card className="p-0">
        {/* UI Upgrade: chat surface */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-500/10 via-transparent to-sky-500/10" aria-hidden />

          <div className="relative max-h-[520px] min-h-[520px] overflow-auto p-4 sm:p-6">
            {loading ? (
              <div className="grid gap-3">
                <Skeleton className="h-14 w-[72%]" />
                <Skeleton className="h-14 w-[55%]" />
                <Skeleton className="ml-auto h-14 w-[66%]" />
                <Skeleton className="h-14 w-[48%]" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((m) => {
                  const mine = meId && m.fromUserId === meId;

                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[560px] rounded-2xl px-4 py-3 ring-1",
                          mine
                            ? "bg-gradient-to-r from-violet-600/25 via-indigo-600/20 to-sky-600/15 ring-white/10"
                            : "bg-white/5 ring-white/10"
                        )}
                      >
                        {m.type === "voice" && m.voiceUrl ? (
                          <audio controls src={m.voiceUrl} className="w-[280px] sm:w-[360px]" />
                        ) : (
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{m.text}</div>
                        )}
                        <div className="mt-2 text-[11px] text-slate-300/70">
                          {new Date(m.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* UI Upgrade: composer */}
          <div className="border-t border-white/10 bg-bg-900/30 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="label">Message</label>
                <textarea
                  className="input min-h-[92px]"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your message…"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={send}
                  disabled={!canSend}
                  loading={sending}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Send
                </Button>

                {recording ? (
                  <Button
                    variant="danger"
                    onClick={stopRecording}
                    leftIcon={<Square className="h-4 w-4" />}
                  >
                    Stop
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={startRecording}
                    leftIcon={<Mic className="h-4 w-4" />}
                  >
                    Voice
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}