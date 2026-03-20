const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    listingIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wishlist", WishlistSchema);
