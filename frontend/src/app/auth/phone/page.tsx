"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Phone, LogIn, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PhoneAuthPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneTrimmed = useMemo(() => phone.trim(), [phone]);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.requestOtp({ phone: phoneTrimmed });
      setStep("verify");
      toast.success("OTP sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to request OTP";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.verifyOtp({ phone: phoneTrimmed, otp: otp.trim() });
      setToken(res.token);
      toast.success("Logged in");
      router.push("/listings");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OTP verification failed";
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
            <div className="text-xl font-semibold tracking-tight text-white">Phone OTP</div>
            <div className="mt-1 text-sm text-slate-300/80">Sign in with a one-time password.</div>
          </div>
          <Link href="/auth/login" className="btn-secondary">
            <LogIn className="h-4 w-4" />
            Email login
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-slate-300/80">
          <span className={step === "request" ? "chip" : "chip opacity-60"}>1. Request</span>
          <ArrowRight className="h-3.5 w-3.5 opacity-60" />
          <span className={step === "verify" ? "chip" : "chip opacity-60"}>2. Verify</span>
        </div>

        {step === "request" ? (
          <form onSubmit={requestOtp} className="mt-6 grid gap-4">
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9xxxx xxxxx"
                required
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button loading={busy} leftIcon={<Phone className="h-4 w-4" />}>
                Request OTP
              </Button>
              <Link className="btn-ghost" href="/listings">
                Continue as guest
              </Link>
            </div>

            {error ? <div className="error">{error}</div> : null}
          </form>
        ) : (
          <form onSubmit={verify} className="mt-6 grid gap-4">
            <div>
              <label className="label">OTP</label>
              <input
                className="input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                required
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button loading={busy}>Verify & Login</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStep("request");
                  setOtp("");
                }}
              >
                Change phone
              </Button>
            </div>

            {error ? <div className="error">{error}</div> : null}
          </form>
        )}
      </Card>
    </div>
  );
}