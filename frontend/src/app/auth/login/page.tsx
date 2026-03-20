"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LogIn, Phone, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.login({ email, password });
      setToken(res.token);
      toast.success("Welcome back");
      router.push("/listings");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight text-white">Login</div>
            <div className="mt-1 text-sm text-slate-300/80">Sign in to save items, chat, and buy securely.</div>
          </div>
          <Link href="/auth/register" className="btn-secondary">
            <UserPlus className="h-4 w-4" />
            Create account
          </Link>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button loading={busy} leftIcon={<LogIn className="h-4 w-4" />}>
              Login
            </Button>
            <Link className="btn-secondary" href="/auth/phone">
              <Phone className="h-4 w-4" />
              Use phone OTP
            </Link>
            <Link className="btn-ghost" href="/listings">
              Continue as guest
            </Link>
          </div>

          {error ? <div className="error">{error}</div> : null}
        </form>
      </Card>
    </div>
  );
}