const mongoose = require("mongoose");

// Production Upgrade: OTP persistence with TTL for serverless environments (Vercel)
// TTL index automatically removes expired OTP docs.
const OtpCodeSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

OtpCodeSchema.index({ phone: 1 }, { unique: true });
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.OtpCode || mongoose.model("OtpCode", OtpCodeSchema);