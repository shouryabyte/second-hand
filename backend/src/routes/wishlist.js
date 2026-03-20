const express = require("express");
const mongoose = require("mongoose");

const Wishlist = require("../models/Wishlist");
const Listing = require("../models/Listing");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/ids", requireAuth, async (req, res) => {
  const userId = String(req.user.sub);
  const wl = await Wishlist.findOne({ userId }).select("listingIds").lean();
  return res.json({ listingIds: wl ? wl.listingIds.map((x) => String(x)) : [] });
});

router.get("/", requireAuth, async (req, res) => {
  const userId = String(req.user.sub);
  const wl = await Wishlist.findOne({ userId }).select("listingIds").lean();
  const listingIds = wl ? wl.listingIds : [];

  const listings = await Listing.find({ _id: { $in: listingIds }, status: "active" })
    .sort({ createdAt: -1 })
    .populate("sellerId", "displayName isVerifiedSeller ratingAvg ratingCount")
    .lean();

  return res.json({
    items: listings.map((it) => ({
      id: String(it._id),
      title: it.title,
      price: it.price,
      currency: it.currency,
      category: it.category,
      condition: it.condition,
      location: it.location,
      image: it.images && it.images[0] ? it.images[0].url : null,
      createdAt: it.createdAt,
      seller: it.sellerId
        ? {
            id: String(it.sellerId._id),
            displayName: it.sellerId.displayName,
            isVerifiedSeller: it.sellerId.isVerifiedSeller,
            ratingAvg: it.sellerId.ratingAvg,
            ratingCount: it.sellerId.ratingCount
          }
        : null
    }))
  });
});

router.post("/:listingId", requireAuth, async (req, res) => {
  const userId = String(req.user.sub);
  const listingId = req.params.listingId;
  if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ error: "Invalid listing id" });

  const listing = await Listing.findById(listingId).select("_id status").lean();
  if (!listing || listing.status !== "active") return res.status(404).json({ error: "Listing not found" });

  await Wishlist.updateOne({ userId }, { $addToSet: { listingIds: listingId } }, { upsert: true });
  return res.json({ ok: true });
});

router.delete("/:listingId", requireAuth, async (req, res) => {
  const userId = String(req.user.sub);
  const listingId = req.params.listingId;
  if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ error: "Invalid listing id" });

  await Wishlist.updateOne({ userId }, { $pull: { listingIds: listingId } });
  return res.json({ ok: true });
});

module.exports = router;
