const mongoose = require("mongoose");

const ThreadSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", default: null, index: true },
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 2,
        message: "Thread participants must have 2 users"
      }
    },
    participantsKey: { type: String, required: true, index: true },
    listingKey: { type: String, required: true, index: true },
    lastMessageAt: { type: Date, default: null },
    lastMessageText: { type: String, default: null }
  },
  { timestamps: true }
);

ThreadSchema.index({ participantsKey: 1, listingKey: 1 }, { unique: true });

ThreadSchema.pre("validate", function preValidate(next) {
  const ids = (this.participants || []).map((x) => String(x)).sort();
  this.participantsKey = ids.join(":");
  this.listingKey = this.listingId ? String(this.listingId) : "none";
  next();
});

module.exports = mongoose.model("Thread", ThreadSchema);
