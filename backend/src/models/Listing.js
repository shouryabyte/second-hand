const mongoose = require("mongoose");

const ListingImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    originalName: { type: String, default: null },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  { _id: false }
);

const ListingSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    category: {
      type: String,
      required: true,
      enum: ["Electronics", "Furniture", "Books", "Vehicles", "Clothes", "Gadgets", "Appliances", "Other"],
      index: true
    },
    condition: { type: String, enum: ["new", "like_new", "used"], default: "used", index: true },
    location: {
      city: { type: String, default: null, trim: true },
      state: { type: String, default: null, trim: true },
      country: { type: String, default: "India", trim: true },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },
    locationText: { type: String, default: "", index: true },
    images: { type: [ListingImageSchema], default: [] },
    status: { type: String, enum: ["active", "sold", "removed"], default: "active", index: true }
  },
  { timestamps: true }
);

ListingSchema.index({ title: "text", description: "text" });
ListingSchema.index({ category: 1, price: 1, status: 1, createdAt: -1 });

ListingSchema.pre("validate", function preValidate(next) {
  const parts = [
    this.location && this.location.city ? this.location.city : "",
    this.location && this.location.state ? this.location.state : "",
    this.location && this.location.country ? this.location.country : ""
  ]
    .filter(Boolean)
    .join(", ");
  this.locationText = parts.toLowerCase();
  next();
});

module.exports = mongoose.model("Listing", ListingSchema);
