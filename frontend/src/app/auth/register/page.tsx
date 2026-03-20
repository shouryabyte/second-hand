"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Phone, UserPlus, LogIn } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.register({
        displayName,
        password,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined
      });
      setToken(res.token);
      toast.success("Account created");
      router.push("/listings");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
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
            <div className="text-xl font-semibold tracking-tight text-white">Create account</div>
            <div className="mt-1 text-sm text-slate-300/80">Join to save items, message sellers, and build trust.</div>
          </div>
          <Link href="/auth/login" className="btn-secondary">
            <LogIn className="h-4 w-4" />
            Login
          </Link>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Display name</label>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Prabhakar"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Min 8 chars"
                required
              />
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9xxxx xxxxx" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button loading={busy} leftIcon={<UserPlus className="h-4 w-4" />}>
              Create account
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