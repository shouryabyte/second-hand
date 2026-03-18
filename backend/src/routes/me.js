const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.user && req.user.sub;
  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({
    id: String(user._id),
    email: user.email || null,
    phone: user.phone || null,
    displayName: user.displayName,
    role: user.role,
    isVerifiedSeller: user.isVerifiedSeller,
    ratingAvg: user.ratingAvg,
    ratingCount: user.ratingCount,
    createdAt: user.createdAt
  });
});

module.exports = router;

