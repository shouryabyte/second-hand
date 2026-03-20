function getFetch() {
  // Reliability: Node 18+ has global fetch; older local dev installs may not.
  // undici provides a fetch implementation compatible with Node 16+.
  if (typeof globalThis.fetch === "function") return globalThis.fetch.bind(globalThis);
  // eslint-disable-next-line global-require
  return require("undici").fetch;
}

function isModelDecommissionedMessage(msg) {
  const s = String(msg || "").toLowerCase();
  return s.includes("decommissioned") || s.includes("no longer supported") || s.includes("deprecated");
}

async function groqChatOnce({ apiKey, model, messages, temperature = 0.2 }) {
  const fetchImpl = getFetch();

  const res = await fetchImpl("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error?.message || data.error || data.message)) || `Groq request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function groqChat({ apiKey, model, messages, temperature = 0.2 }) {
  try {
    return await groqChatOnce({ apiKey, model, messages, temperature });
  } catch (err) {
    // Production Fix: auto-fallback when a model gets deprecated/decommissioned.
    const fallback = getGroqFallbackModel();
    if (model !== fallback && isModelDecommissionedMessage(err?.message) && String(model) === "llama-3.1-70b-versatile") {
      return await groqChatOnce({ apiKey, model: fallback, messages, temperature });
    }
    throw err;
  }
}

function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

function getGroqFallbackModel() {
  return process.env.GROQ_FALLBACK_MODEL || "llama-3.3-70b-versatile";
}

function getGroqModel() {
  return process.env.GROQ_MODEL || getGroqFallbackModel();
}

module.exports = { groqChat, isGroqConfigured, getGroqModel, getGroqFallbackModel };