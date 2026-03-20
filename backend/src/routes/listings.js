const express = require("express");
const multer = require("multer");

const Listing = require("../models/Listing");
const { requireAuth } = require("../middleware/auth");
const { createListingSchema, listQuerySchema } = require("../validators/listings");
const { uploadImage, getUploadProvider } = require("../services/upload.service");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 6,
    fileSize: 2 * 1024 * 1024
  }
});

function assessFraudRisk({ title, description, price }) {
  const reasons = [];
  const text = `${title} ${description}`.toLowerCase();
  const urlCount = (text.match(/https?:\/\//g) || []).length;
  if (urlCount >= 1) reasons.push("contains_link");
  if (price <= 0) reasons.push("zero_price");
  if (/(free|giveaway|urgent)/.test(text) && price < 200) reasons.push("suspicious_terms");
  return reasons;
}

router.post("/", requireAuth, upload.array("images", 6), async (req, res) => {
  const parsed = createListingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", fields: parsed.error.flatten().fieldErrors, formErrors: parsed.error.flatten().formErrors });
  }

  const data = parsed.data;
  const files = Array.isArray(req.files) ? req.files : [];

  let images = [];
  try {
    images = await Promise.all(files.map((f) => uploadImage(req, f)));
  } catch (err) {
    return res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }

  const fraudReasons = assessFraudRisk({ title: data.title, description: data.description, price: data.price });

  const listing = await Listing.create({
    sellerId: req.user.sub,
    title: data.title,
    description: data.description,
    price: data.price,
    currency: data.currency || "INR",
    category: data.category,
    condition: data.condition || "used",
    allowOffers: true,
    isSuspicious: fraudReasons.length > 0,
    fraudReasons,
    location: {
      city: data.city || null,
      state: data.state || null,
      country: data.country || "India",
      lat: typeof data.lat === "number" ? data.lat : null,
      lng: typeof data.lng === "number" ? data.lng : null
    },
    images
  });

  return res.status(201).json({ id: String(listing._id), uploadProvider: getUploadProvider() });
});

router.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
  }

  const q = parsed.data;
  const page = q.page || 1;
  const limit = q.limit || 12;

  const filter = { status: "active" };
  if (q.category) filter.category = q.category;
  if (q.sellerId) filter.sellerId = q.sellerId;
  if (q.minPrice != null || q.maxPrice != null) {
    filter.price = {};
    if (q.minPrice != null) filter.price.$gte = q.minPrice;
    if (q.maxPrice != null) filter.price.$lte = q.maxPrice;
  }

  if (q.city || q.state || q.country) {
    const parts = [q.city, q.state, q.country].filter(Boolean).join(", ").toLowerCase();
    const escaped = parts.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.locationText = { $regex: escaped, $options: "i" };
  }

  if (q.q) {
    filter.$text = { $search: q.q };
  }

  const sort =
    q.sort === "price_asc"
      ? { price: 1, createdAt: -1 }
      : q.sort === "price_desc"
        ? { price: -1, createdAt: -1 }
        : q.q
          ? { score: { $meta: "textScore" }, createdAt: -1 }
          : { createdAt: -1 };

  const projection = q.q ? { score: { $meta: "textScore" } } : {};

  const [items, total] = await Promise.all([
    Listing.find(filter, projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sellerId", "displayName ratingAvg ratingCount isVerifiedSeller")
      .lean(),
    Listing.countDocuments(filter)
  ]);

  return res.json({
    page,
    limit,
    total,
    items: items.map((it) => ({
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

router.get("/:id", async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate("sellerId", "displayName email phone ratingAvg ratingCount isVerifiedSeller")
    .lean();

  if (!listing || listing.status !== "active") return res.status(404).json({ error: "Not found" });

  return res.json({
    id: String(listing._id),
    title: listing.title,
    description: listing.description,
    price: listing.price,
    currency: listing.currency,
    category: listing.category,
    condition: listing.condition,
    location: listing.location,
    images: listing.images || [],
    allowOffers: listing.allowOffers,
    createdAt: listing.createdAt,
    seller: listing.sellerId
      ? {
          id: String(listing.sellerId._id),
          displayName: listing.sellerId.displayName,
          email: listing.sellerId.email || null,
          phone: listing.sellerId.phone || null,
          isVerifiedSeller: listing.sellerId.isVerifiedSeller,
          ratingAvg: listing.sellerId.ratingAvg,
          ratingCount: listing.sellerId.ratingCount
        }
      : null
  });
});

router.get("/:id/similar", async (req, res) => {
  const listing = await Listing.findById(req.params.id).select("category title status").lean();
  if (!listing || listing.status !== "active") return res.status(404).json({ error: "Not found" });

  const items = await Listing.find({
    _id: { $ne: listing._id },
    status: "active",
    category: listing.category
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  return res.json({
    items: items.map((it) => ({
      id: String(it._id),
      title: it.title,
      price: it.price,
      currency: it.currency,
      category: it.category,
      condition: it.condition,
      location: it.location,
      image: it.images && it.images[0] ? it.images[0].url : null,
      createdAt: it.createdAt
    }))
  });
});

module.exports = router;
