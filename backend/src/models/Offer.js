const mongoose = require("mongoose");

const OfferSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    amount: { type: Number, required: true, min: 0 },
    message: { type: String, default: null, trim: true, maxlength: 500 },

    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", index: true }
  },
  { timestamps: true }
);

OfferSchema.index({ listingId: 1, buyerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Offer", OfferSchema);
