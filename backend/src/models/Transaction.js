const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true, index: true },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },

    provider: { type: String, enum: ["razorpay"], default: "razorpay" },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded", "disputed"],
      default: "created",
      index: true
    },

    razorpayOrderId: { type: String, default: null, index: true },
    razorpayPaymentId: { type: String, default: null, index: true },

    disputeReason: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
