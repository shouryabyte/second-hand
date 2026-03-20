const { z } = require("zod");

const createThreadSchema = z.object({
  listingId: z.string().min(1)
});

const sendMessageSchema = z.object({
  text: z.string().min(1).max(2000)
});

module.exports = { createThreadSchema, sendMessageSchema };
