// Demo-only in-memory OTP store.
// In production, use Redis (TTL), rate limits, and never return the OTP to the client.

const otpByPhone = new Map(); // phone -> { otp, expiresAt }

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function putOtp(phone, otp, ttlMs) {
  otpByPhone.set(phone, { otp, expiresAt: Date.now() + ttlMs });
}

function verifyOtp(phone, otp) {
  const record = otpByPhone.get(phone);
  if (!record) return { ok: false, reason: "missing" };
  if (Date.now() > record.expiresAt) {
    otpByPhone.delete(phone);
    return { ok: false, reason: "expired" };
  }
  if (record.otp !== otp) return { ok: false, reason: "mismatch" };
  otpByPhone.delete(phone);
  return { ok: true };
}

module.exports = { generateOtp, putOtp, verifyOtp };

