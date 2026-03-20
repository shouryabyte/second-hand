const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: "Thread", required: true, index: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["text", "voice"], default: "text" },
    text: { type: String, default: null, trim: true, maxlength: 2000 },
    voiceUrl: { type: String, default: null },
    voicePublicId: { type: String, default: null },
    voiceMimeType: { type: String, default: null },
    voiceSize: { type: Number, default: null },
    isSpam: { type: Boolean, default: false }
  },
  { timestamps: true }
);

MessageSchema.index({ threadId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", MessageSchema);
