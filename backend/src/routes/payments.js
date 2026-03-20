const express = require("express");
const mongoose = require("mongoose");

const { requireAuth } = require("../middleware/auth");
const Listing = require("../models/Listing");
const Transaction = require("../models/Transaction");
const { isRazorpayConfigured, getClient, verifySignature } = require("../services/razorpay.service");

const router = express.Router();

router.get("/public-key", (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID) return res.status(501).json({ error: "Razorpay is not configured" });
  return res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

router.post("/create-order", requireAuth, async (req, res) => {
  if (!isRazorpayConfigured()) return res.status(501).json({ error: "Razorpay is not configured" });

  const { listingId } = req.body || {};
  if (!listingId || !mongoose.isValidObjectId(listingId)) return res.status(400).json({ error: "Invalid listingId" });

  const listing = await Listing.findById(listingId).select("sellerId price currency status title").lean();
  if (!listing || listing.status !== "active") return res.status(404).json({ error: "Listing not found" });

  const buyerId = String(req.user.sub);
  const sellerId = String(listing.sellerId);
  if (buyerId === sellerId) return res.status(400).json({ error: "Cannot buy your own listing" });

  const amountPaise = Math.round(Number(listing.price) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) return res.status(400).json({ error: "Invalid price" });

  const client = getClient();
  const receipt = `rcpt_${Date.now()}`;
  const order = await client.orders.create({
    amount: amountPaise,
    currency: listing.currency || "INR",
    receipt,
    notes: { listingId: String(listingId), buyerId, sellerId }
  });

  const tx = await Transaction.create({
    buyerId,
    sellerId,
    listingId,
    amount: Number(listing.price),
    currency: listing.currency || "INR",
    provider: "razorpay",
    status: "created",
    razorpayOrderId: order.id
  });

  return res.json({
    transactionId: String(tx._id),
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    name: "NexChakra Market",
    description: listing.title
  });
});

router.post("/verify", requireAuth, async (req, res) => {
  if (!isRazorpayConfigured()) return res.status(501).json({ error: "Razorpay is not configured" });

  const { transactionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!transactionId || !mongoose.isValidObjectId(transactionId)) return res.status(400).json({ error: "Invalid transactionId" });

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing Razorpay fields" });
  }

  const tx = await Transaction.findById(transactionId);
  if (!tx) return res.status(404).json({ error: "Transaction not found" });
  if (String(tx.buyerId) !== String(req.user.sub)) return res.status(403).json({ error: "Forbidden" });

  // Production Upgrade: bind verification to the exact order created for this transaction
  if (tx.razorpayOrderId && String(tx.razorpayOrderId) !== String(razorpay_order_id)) {
    tx.status = "failed";
    await tx.save();
    return res.status(400).json({ error: "Order mismatch" });
  }

  if (tx.status === "paid") return res.json({ ok: true });

  const ok = verifySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature
  });

  if (!ok) {
    tx.status = "failed";
    await tx.save();
    return res.status(400).json({ error: "Invalid signature" });
  }

  tx.status = "paid";
  tx.razorpayPaymentId = razorpay_payment_id;
  await tx.save();

  await Listing.updateOne({ _id: tx.listingId }, { $set: { status: "sold" } });

  return res.json({ ok: true });
});

router.get("/mine", requireAuth, async (req, res) => {
  const userId = String(req.user.sub);
  const items = await Transaction.find({ $or: [{ buyerId: userId }, { sellerId: userId }] })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("listingId", "title")
    .lean();

  return res.json({
    items: items.map((t) => ({
      id: String(t._id),
      status: t.status,
      amount: t.amount,
      currency: t.currency,
      listing: t.listingId ? { id: String(t.listingId._id), title: t.listingId.title } : null,
      createdAt: t.createdAt
    }))
  });
});

module.exports = router;