const express = require("express");
const mongoose = require("mongoose");

const Offer = require("../models/Offer");
const Listing = require("../models/Listing");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/:listingId", requireAuth, async (req, res) => {
  const listingId = req.params.listingId;
  if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ error: "Invalid listing id" });

  const { amount, message } = req.body || {};
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) return res.status(400).json({ error: "Invalid amount" });

  const listing = await Listing.findById(listingId).select("sellerId price status allowOffers").lean();
  if (!listing || listing.status !== "active") return res.status(404).json({ error: "Listing not found" });
  if (!listing.allowOffers) return res.status(400).json({ error: "Offers disabled" });

  const buyerId = String(req.user.sub);
  const sellerId = String(listing.sellerId);
  if (buyerId === sellerId) return res.status(400).json({ error: "Cannot offer on your own listing" });

  const offer = await Offer.create({
    listingId,
    buyerId,
    sellerId,
    amount: numeric,
    message: message ? String(message).slice(0, 500) : null,
    status: "pending"
  });

  return res.status(201).json({ id: String(offer._id) });
});

router.get("/received", requireAuth, async (req, res) => {
  const sellerId = String(req.user.sub);
  const offers = await Offer.find({ sellerId }).sort({ createdAt: -1 }).limit(100).populate("listingId", "title price currency").populate("buyerId", "displayName").lean();

  return res.json({
    items: offers.map((o) => ({
      id: String(o._id),
      listing: o.listingId ? { id: String(o.listingId._id), title: o.listingId.title, price: o.listingId.price, currency: o.listingId.currency } : null,
      buyer: o.buyerId ? { id: String(o.buyerId._id), displayName: o.buyerId.displayName } : null,
      amount: o.amount,
      message: o.message,
      status: o.status,
      createdAt: o.createdAt
    }))
  });
});

router.get("/sent", requireAuth, async (req, res) => {
  const buyerId = String(req.user.sub);
  const offers = await Offer.find({ buyerId }).sort({ createdAt: -1 }).limit(100).populate("listingId", "title price currency").populate("sellerId", "displayName").lean();

  return res.json({
    items: offers.map((o) => ({
      id: String(o._id),
      listing: o.listingId ? { id: String(o.listingId._id), title: o.listingId.title, price: o.listingId.price, currency: o.listingId.currency } : null,
      seller: o.sellerId ? { id: String(o.sellerId._id), displayName: o.sellerId.displayName } : null,
      amount: o.amount,
      message: o.message,
      status: o.status,
      createdAt: o.createdAt
    }))
  });
});

router.post("/:offerId/accept", requireAuth, async (req, res) => {
  const offerId = req.params.offerId;
  if (!mongoose.isValidObjectId(offerId)) return res.status(400).json({ error: "Invalid offer id" });

  const offer = await Offer.findById(offerId);
  if (!offer) return res.status(404).json({ error: "Offer not found" });
  if (String(offer.sellerId) !== String(req.user.sub)) return res.status(403).json({ error: "Forbidden" });

  offer.status = "accepted";
  await offer.save();

  return res.json({ ok: true });
});

router.post("/:offerId/reject", requireAuth, async (req, res) => {
  const offerId = req.params.offerId;
  if (!mongoose.isValidObjectId(offerId)) return res.status(400).json({ error: "Invalid offer id" });

  const offer = await Offer.findById(offerId);
  if (!offer) return res.status(404).json({ error: "Offer not found" });
  if (String(offer.sellerId) !== String(req.user.sub)) return res.status(403).json({ error: "Forbidden" });

  offer.status = "rejected";
  await offer.save();

  return res.json({ ok: true });
});

module.exports = router;
