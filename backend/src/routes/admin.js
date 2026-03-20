const express = require("express");

const User = require("../models/User");
const Listing = require("../models/Listing");
const Message = require("../models/Message");
const Thread = require("../models/Thread");
const Transaction = require("../models/Transaction");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", async (req, res) => {
  const [users, listingsActive, listingsSuspicious, threads, messages, transactionsPaid] = await Promise.all([
    User.countDocuments({}),
    Listing.countDocuments({ status: "active" }),
    Listing.countDocuments({ status: "active", isSuspicious: true }),
    Thread.countDocuments({}),
    Message.countDocuments({}),
    Transaction.countDocuments({ status: "paid" })
  ]);

  const revenueAgg = await Transaction.aggregate([
    { $match: { status: "paid" } },
    { $group: { _id: "$currency", total: { $sum: "$amount" }, count: { $sum: 1 } } }
  ]);

  return res.json({
    users,
    listingsActive,
    listingsSuspicious,
    threads,
    messages,
    transactionsPaid,
    revenue: revenueAgg.map((r) => ({ currency: r._id, total: r.total, count: r.count }))
  });
});

router.get("/users", async (req, res) => {
  const items = await User.find({}).sort({ createdAt: -1 }).limit(200).lean();
  return res.json({
    items: items.map((u) => ({
      id: String(u._id),
      email: u.email || null,
      phone: u.phone || null,
      displayName: u.displayName,
      role: u.role,
      isVerifiedSeller: u.isVerifiedSeller,
      ratingAvg: u.ratingAvg,
      ratingCount: u.ratingCount,
      createdAt: u.createdAt
    }))
  });
});

router.post("/users/:id/verify-seller", async (req, res) => {
  const id = req.params.id;
  const { value } = req.body || {};
  await User.updateOne({ _id: id }, { $set: { isVerifiedSeller: Boolean(value) } });
  return res.json({ ok: true });
});

router.post("/users/:id/role", async (req, res) => {
  const id = req.params.id;
  const { role } = req.body || {};
  if (role !== "admin" && role !== "user") return res.status(400).json({ error: "Invalid role" });
  await User.updateOne({ _id: id }, { $set: { role } });
  return res.json({ ok: true });
});

router.get("/listings", async (req, res) => {
  const items = await Listing.find({}).sort({ createdAt: -1 }).limit(200).populate("sellerId", "displayName email").lean();
  return res.json({
    items: items.map((l) => ({
      id: String(l._id),
      title: l.title,
      price: l.price,
      currency: l.currency,
      status: l.status,
      isSuspicious: l.isSuspicious,
      fraudReasons: l.fraudReasons,
      seller: l.sellerId ? { id: String(l.sellerId._id), displayName: l.sellerId.displayName, email: l.sellerId.email || null } : null,
      createdAt: l.createdAt
    }))
  });
});

router.post("/listings/:id/status", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body || {};
  if (!["active", "sold", "removed"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  await Listing.updateOne({ _id: id }, { $set: { status } });
  return res.json({ ok: true });
});

router.post("/listings/:id/clear-suspicious", async (req, res) => {
  const id = req.params.id;
  await Listing.updateOne({ _id: id }, { $set: { isSuspicious: false, fraudReasons: [] } });
  return res.json({ ok: true });
});

router.get("/transactions", async (req, res) => {
  const items = await Transaction.find({}).sort({ createdAt: -1 }).limit(200).populate("listingId", "title").lean();
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

router.get("/spam-messages", async (req, res) => {
  const items = await Message.find({ isSpam: true }).sort({ createdAt: -1 }).limit(200).lean();
  return res.json({
    items: items.map((m) => ({
      id: String(m._id),
      threadId: String(m.threadId),
      fromUserId: String(m.fromUserId),
      type: m.type,
      text: m.text,
      createdAt: m.createdAt
    }))
  });
});

module.exports = router;
