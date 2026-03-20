const crypto = require("crypto");
const OtpCode = require("../models/OtpCode");

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpHashSecret() {
  // Use a dedicated secret when possible; fallback to JWT secret to avoid accidental plaintext OTP storage.
  return (process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || "change_me").trim();
}

function hashOtp(phone, otp) {
  return crypto.createHash("sha256").update(`${otpHashSecret()}:${phone}:${otp}`).digest("hex");
}

async function putOtp(phone, otp, ttlMs) {
  const expiresAt = new Date(Date.now() + ttlMs);
  const otpHash = hashOtp(phone, otp);

  await OtpCode.updateOne(
    { phone },
    { $set: { phone, otpHash, expiresAt, attempts: 0 } },
    { upsert: true }
  );
}

async function verifyOtp(phone, otp) {
  const rec = await OtpCode.findOne({ phone });
  if (!rec) return { ok: false, reason: "missing" };

  if (Date.now() > rec.expiresAt.getTime()) {
    await OtpCode.deleteOne({ _id: rec._id });
    return { ok: false, reason: "expired" };
  }

  if (rec.attempts >= 5) {
    await OtpCode.deleteOne({ _id: rec._id });
    return { ok: false, reason: "locked" };
  }

  const ok = rec.otpHash === hashOtp(phone, otp);
  if (!ok) {
    rec.attempts += 1;
    await rec.save();
    return { ok: false, reason: "mismatch" };
  }

  await OtpCode.deleteOne({ _id: rec._id });
  return { ok: true };
}

function shouldEchoOtp() {
  // Production default: do not echo OTP to the client.
  // For demos, set OTP_ECHO_TO_RESPONSE=true.
  return String(process.env.OTP_ECHO_TO_RESPONSE || "").toLowerCase() === "true";
}

module.exports = { generateOtp, putOtp, verifyOtp, shouldEchoOtp };