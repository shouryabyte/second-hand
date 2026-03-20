const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const Listing = require("../models/Listing");
const Thread = require("../models/Thread");
const Message = require("../models/Message");
const { requireAuth } = require("../middleware/auth");
const { createThreadSchema, sendMessageSchema } = require("../validators/threads");
const { uploadVoice } = require("../services/upload.service");

const router = express.Router();

function computeParticipantsKey(a, b) {
  return [String(a), String(b)].sort().join(":");
}

function isSpamText(text) {
  const urlCount = (text.match(/https?:\/\//gi) || []).length;
  if (urlCount >= 2) return true;
  if (/(.)\1{19,}/.test(text)) return true;
  return false;
}

const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = createThreadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { listingId } = parsed.data;
  if (!mongoose.isValidObjectId(listingId)) {
    return res.status(400).json({ error: "Invalid listingId" });
  }

  const listing = await Listing.findById(listingId).select("sellerId title").lean();
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const buyerId = String(req.user.sub);
  const sellerId = String(listing.sellerId);
  if (buyerId === sellerId) return res.status(400).json({ error: "Cannot message yourself" });

  const participantsKey = computeParticipantsKey(buyerId, sellerId);
  const listingKey = String(listingId);

  let thread = await Thread.findOne({ participantsKey, listingKey });
  if (!thread) {
    thread = await Thread.create({
      listingId,
      participants: [buyerId, sellerId],
      participantsKey,
      listingKey,
      lastMessageAt: null,
      lastMessageText: null
    });
  }

  return res.json({ id: String(thread._id) });
});

router.get("/", requireAuth, async (req, res) => {
  const userId = String(req.user.sub);
  const threads = await Thread.find({ participants: userId })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate("listingId", "title price currency category images location")
    .populate("participants", "displayName")
    .lean();

  return res.json({
    items: threads.map((t) => {
      const other = (t.participants || []).find((p) => String(p._id) !== userId) || null;
      const listing = t.listingId
        ? {
            id: String(t.listingId._id),
            title: t.listingId.title,
            price: t.listingId.price,
            currency: t.listingId.currency,
            category: t.listingId.category,
            image: t.listingId.images && t.listingId.images[0] ? t.listingId.images[0].url : null,
            location: t.listingId.location || null
          }
        : null;

      return {
        id: String(t._id),
        listing,
        otherUser: other ? { id: String(other._id), displayName: other.displayName } : null,
        lastMessageAt: t.lastMessageAt,
        lastMessageText: t.lastMessageText
      };
    })
  });
});

router.get("/:id/messages", requireAuth, async (req, res) => {
  const threadId = req.params.id;
  if (!mongoose.isValidObjectId(threadId)) return res.status(400).json({ error: "Invalid thread id" });

  const userId = String(req.user.sub);
  const thread = await Thread.findById(threadId).select("participants listingId").lean();
  if (!thread) return res.status(404).json({ error: "Thread not found" });

  const isParticipant = (thread.participants || []).some((p) => String(p) === userId);
  if (!isParticipant) return res.status(403).json({ error: "Forbidden" });

  const messages = await Message.find({ threadId }).sort({ createdAt: 1 }).limit(200).lean();

  return res.json({
    threadId,
    messages: messages.map((m) => ({
      id: String(m._id),
      fromUserId: String(m.fromUserId),
      type: m.type,
      text: m.text,
      voiceUrl: m.voiceUrl,
      createdAt: m.createdAt
    }))
  });
});

router.post("/:id/messages", requireAuth, async (req, res) => {
  const threadId = req.params.id;
  if (!mongoose.isValidObjectId(threadId)) return res.status(400).json({ error: "Invalid thread id" });

  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const userId = String(req.user.sub);
  const thread = await Thread.findById(threadId).select("participants").lean();
  if (!thread) return res.status(404).json({ error: "Thread not found" });

  const isParticipant = (thread.participants || []).some((p) => String(p) === userId);
  if (!isParticipant) return res.status(403).json({ error: "Forbidden" });

  const text = parsed.data.text.trim();
  const message = await Message.create({
    threadId,
    fromUserId: userId,
    type: "text",
    text,
    isSpam: isSpamText(text)
  });

  await Thread.updateOne(
    { _id: threadId },
    { $set: { lastMessageAt: new Date(), lastMessageText: text.slice(0, 160) } }
  );

  return res.status(201).json({
    id: String(message._id),
    fromUserId: String(message.fromUserId),
    type: message.type,
    text: message.text,
    createdAt: message.createdAt
  });
});

router.post("/:id/voice", requireAuth, voiceUpload.single("voice"), async (req, res) => {
  const threadId = req.params.id;
  if (!mongoose.isValidObjectId(threadId)) return res.status(400).json({ error: "Invalid thread id" });

  const userId = String(req.user.sub);
  const thread = await Thread.findById(threadId).select("participants").lean();
  if (!thread) return res.status(404).json({ error: "Thread not found" });

  const isParticipant = (thread.participants || []).some((p) => String(p) === userId);
  if (!isParticipant) return res.status(403).json({ error: "Forbidden" });

  if (!req.file) return res.status(400).json({ error: "Missing voice file" });

  let uploaded;
  try {
    uploaded = await uploadVoice(req, req.file);
  } catch (err) {
    return res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }

  const message = await Message.create({
    threadId,
    fromUserId: userId,
    type: "voice",
    text: null,
    voiceUrl: uploaded.url,
    voicePublicId: uploaded.publicId,
    voiceMimeType: uploaded.mimeType,
    voiceSize: uploaded.size,
    isSpam: false
  });

  await Thread.updateOne(
    { _id: threadId },
    { $set: { lastMessageAt: new Date(), lastMessageText: "[Voice message]" } }
  );

  return res.status(201).json({
    id: String(message._id),
    fromUserId: String(message.fromUserId),
    type: message.type,
    voiceUrl: message.voiceUrl,
    createdAt: message.createdAt
  });
});

module.exports = router;
