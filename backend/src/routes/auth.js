const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { signAccessToken } = require("../utils/jwt");
const { generateOtp, putOtp, verifyOtp } = require("../utils/otpStore");
const { registerSchema, loginSchema, requestOtpSchema, verifyOtpSchema } = require("../validators/auth");

const router = express.Router();

function issueToken(user) {
  const token = signAccessToken(
    { sub: String(user._id), role: user.role },
    { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  return token;
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { email, phone, password, displayName } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await User.create({ email, phone, passwordHash, displayName });
    const token = issueToken(user);
    return res.status(201).json({
      token,
      user: { id: String(user._id), email: user.email, phone: user.phone, displayName: user.displayName }
    });
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    const isDup = message.includes("E11000 duplicate key error");
    return res.status(isDup ? 409 : 500).json({ error: isDup ? "User already exists" : "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email }).lean(false);
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = issueToken(user);
  return res.json({
    token,
    user: { id: String(user._id), email: user.email, phone: user.phone, displayName: user.displayName }
  });
});

router.post("/request-otp", async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { phone } = parsed.data;
  const otp = generateOtp();
  putOtp(phone, otp, 5 * 60 * 1000);

  // Demo behavior: return OTP so the prototype can be tested without an SMS gateway.
  return res.json({ ok: true, phone, otp, expiresInSec: 300 });
});

router.post("/verify-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { phone, otp } = parsed.data;
  const result = verifyOtp(phone, otp);
  if (!result.ok) {
    return res.status(401).json({ error: "Invalid OTP", reason: result.reason });
  }

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({ phone, displayName: `User ${phone.slice(-4)}`, passwordHash: null });
  }

  const token = issueToken(user);
  return res.json({
    token,
    user: { id: String(user._id), email: user.email, phone: user.phone, displayName: user.displayName }
  });
});

module.exports = router;

