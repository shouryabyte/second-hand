const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { isGroqConfigured, groqChat, getGroqModel } = require("../services/groq.service");

const router = express.Router();

router.post("/price-suggest", requireAuth, async (req, res) => {
  if (!isGroqConfigured()) return res.status(501).json({ error: "Groq is not configured" });

  const { title, category, condition, description, city, state } = req.body || {};
  if (!title || !category) return res.status(400).json({ error: "title and category are required" });

  const prompt = `Suggest a realistic second-hand price in INR for this item. Respond in a human-friendly format with:
1) Suggested price (single number in INR)
2) Expected range (min–max in INR)
3) Short reasoning (2–4 bullets)
Do not return JSON.

Title: ${title}
Category: ${category}
Condition: ${condition || "used"}
Location: ${[city, state].filter(Boolean).join(", ")}
Description: ${description || ""}`;

  try {
    const data = await groqChat({
      apiKey: process.env.GROQ_API_KEY,
      model: getGroqModel(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    const text = data?.choices?.[0]?.message?.content || "";
    return res.json({ text });
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : "AI request failed" });
  }
});

router.post("/description", requireAuth, async (req, res) => {
  if (!isGroqConfigured()) return res.status(501).json({ error: "Groq is not configured" });

  const { title, category, condition, city, state, notes } = req.body || {};
  if (!title || !category) return res.status(400).json({ error: "title and category are required" });

  const prompt = `Write a concise, trustworthy marketplace description for a second-hand item. Include condition, what is included, and any known issues. Avoid hype. 6-10 lines.

Title: ${title}
Category: ${category}
Condition: ${condition || "used"}
Location: ${[city, state].filter(Boolean).join(", ")}
Seller notes: ${notes || ""}`;

  try {
    const data = await groqChat({
      apiKey: process.env.GROQ_API_KEY,
      model: getGroqModel(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    });

    const text = data?.choices?.[0]?.message?.content || "";
    return res.json({ text });
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : "AI request failed" });
  }
});

module.exports = router;