// backend/services/ai.js
const OpenAI = require("openai");

const apiKey = process.env.OPENAI_API_KEY || null;
const hasKey = !!apiKey;

console.log("[AI] OPENAI_API_KEY present:", hasKey);
if (hasKey) console.log("[AI] OPENAI_API_KEY length:", apiKey.length);

let client = null;
if (hasKey) client = new OpenAI({ apiKey });
else console.warn("[AI] No API key detected at load time. Using echo fallback.");

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

function getMaxOutputTokens() {
  const n = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 500);
  return Number.isFinite(n) && n > 0 ? n : 500;
}

function safeErrorReply(prompt, err) {
  const isDev = process.env.NODE_ENV !== "production";
  const msg = err?.message ? err.message : String(err);
  if (!isDev) return "I hit an error generating a response. Try again.";
  return `[OPENAI_ERROR: ${msg}] Echo: ${prompt}`;
}

async function generateResponse(prompt) {
  if (!client) return `[NO_CLIENT] Echo: ${prompt}`;

  try {
    const response = await client.responses.create({
      model: getModel(),
      input: prompt,
      max_output_tokens: getMaxOutputTokens(),
    });

    const text = typeof response.output_text === "string" ? response.output_text : "";
    return text || `[NO_TEXT] Echo: ${prompt}`;
  } catch (err) {
    console.error("[AI] Error from OpenAI:", err);
    return safeErrorReply(prompt, err);
  }
}

async function generateResponseStream(prompt, onToken) {
  if (!client) {
    const text = `[NO_CLIENT] Echo: ${prompt}`;
    if (typeof onToken === "function") onToken(text);
    return text;
  }

  const parts = [];

  try {
    const stream = await client.responses.create({
      model: process.env.OPENAI_STREAM_MODEL || getModel(),
      input: prompt,
      stream: true,
      max_output_tokens: getMaxOutputTokens(),
    });

    for await (const event of stream) {
      let token = "";

      if (event?.type === "response.output_text.delta" && typeof event.delta === "string") token = event.delta;
      if (!token && event?.type === "response.output_text.done" && typeof event.text === "string") token = event.text;
      if (!token && typeof event?.output_text === "string") token = event.output_text;

      if (!token) continue;

      parts.push(token);
      if (typeof onToken === "function") onToken(token);
    }

    return parts.join("");
  } catch (err) {
    console.error("[AI] Stream error from OpenAI:", err);
    const text = safeErrorReply(prompt, err);
    if (typeof onToken === "function") onToken(text);
    return text;
  }
}

module.exports = { generateResponse, generateResponseStream };