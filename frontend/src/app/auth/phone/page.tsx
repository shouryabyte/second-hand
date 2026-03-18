"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function PhoneAuthPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [issuedOtp, setIssuedOtp] = useState<string | null>(null);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneTrimmed = useMemo(() => phone.trim(), [phone]);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.requestOtp({ phone: phoneTrimmed });
      setIssuedOtp(res.otp);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request OTP");
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
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="col12">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 950, fontSize: 20 }}>Phone OTP</div>
              <div className="help">Sign in with a one-time password.</div>
            </div>
            <Link href="/auth/login" className="pill">
              Email login
            </Link>
          </div>

          {step === "request" ? (
            <form onSubmit={requestOtp} style={{ marginTop: 12 }}>
              <label>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9xxxx xxxxx" />
              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn" disabled={busy}>
                  {busy ? "Sending..." : "Request OTP"}
                </button>
                <Link className="btn btnSecondary" href="/listings">
                  Continue as guest
                </Link>
              </div>
              {error ? <div className="error">{error}</div> : null}
            </form>
          ) : (
            <form onSubmit={verify} style={{ marginTop: 12 }}>
              {issuedOtp ? <div className="pill">OTP: {issuedOtp}</div> : null}
              <label style={{ marginTop: 12 }}>OTP</label>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" />
              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn" disabled={busy}>
                  {busy ? "Verifying..." : "Verify & Login"}
                </button>
                <button
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => {
                    setStep("request");
                    setOtp("");
                    setIssuedOtp(null);
                  }}
                >
                  Change phone
                </button>
              </div>
              {error ? <div className="error">{error}</div> : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
