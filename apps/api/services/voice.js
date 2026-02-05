// apps/api/services/voice.js
const OpenAI = require("openai");

/**
 * Voice is OPTIONAL.
 * This file must NOT crash the API if OPENAI_API_KEY is missing.
 * Repo uses CommonJS ("type":"commonjs"), so keep require/module.exports.
 */
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const client = hasOpenAIKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * Voice packs:
 * - "inspired" packs are allowed
 * - "custom" packs must be consentVerified=true or they are blocked
 *
 * Backward compatibility:
 * - Keep shantell_* ids as aliases so old configs don't break.
 */
const VOICE_PACKS = {
  // Canonical Bently packs
  bently_inspired: {
    id: "bently_inspired",
    label: "Bently (Inspired)",
    provider: "openai",
    voice: "coral", // placeholder voice
    model: "gpt-4o-mini-tts",
    consentVerified: true,
    lockedReason: null,
  },

  bently_custom_locked: {
    id: "bently_custom_locked",
    label: "Custom Bently (Locked)",
    provider: "custom",
    voice: null,
    model: null,
    consentVerified: false,
    lockedReason: "Custom voice is locked until consent/rights are verified.",
  },

  // Backward-compatible aliases (old Shantell ids map to canonical Bently packs)
  shantell_inspired: {
    id: "bently_inspired",
    label: "Bently (Inspired)",
    provider: "openai",
    voice: "coral",
    model: "gpt-4o-mini-tts",
    consentVerified: true,
    lockedReason: null,
    aliasOf: "bently_inspired",
  },

  shantell_custom_locked: {
    id: "bently_custom_locked",
    label: "Custom Bently (Locked)",
    provider: "custom",
    voice: null,
    model: null,
    consentVerified: false,
    lockedReason: "Custom voice is locked until consent/rights are verified.",
    aliasOf: "bently_custom_locked",
  },
};

function getVoicePack(voicePackId) {
  if (!voicePackId) return VOICE_PACKS.bently_inspired;
  return VOICE_PACKS[voicePackId] || VOICE_PACKS.bently_inspired;
}

/**
 * Build speech delivery instructions that match Bently’s vibe + toneMode.
 * Keep it short. Instructions help pacing/emphasis.
 */
function buildDeliveryInstructions({ toneMode, delivery }) {
  const d = delivery || {};
  const pace = d.pace || "medium"; // slow | medium | fast
  const warmth = typeof d.warmth === "number" ? d.warmth : 0.5; // 0..1
  const edge = typeof d.edge === "number" ? d.edge : 0.7; // 0..1

  let toneLine = "";
  if (toneMode === "soft") {
    toneLine =
      "Sound warm and grounded. Speak gently, like a big sister who cares. Avoid harshness.";
  } else if (toneMode === "steady") {
    toneLine =
      "Sound direct and calm. Big-sister energy. Crisp sentences, confident cadence.";
  } else if (toneMode === "push") {
    toneLine =
      "Sound blunt and firm. Big-sister 'stop playing' energy. Slight edge, but not mean.";
  } else if (toneMode === "crisis") {
    toneLine =
      "Sound calm and steady. No edge. No aggression. Focus on safety and presence.";
  } else {
    toneLine = "Sound direct and human. Big-sister vibe.";
  }

  let paceLine = "";
  if (pace === "slow") paceLine = "Speak slower with more pauses.";
  else if (pace === "fast") paceLine = "Speak faster, tight and snappy.";
  else paceLine = "Speak at a natural conversational pace.";

  const warmthLine =
    warmth >= 0.65
      ? "Warmth is high."
      : warmth <= 0.35
      ? "Warmth is low."
      : "Warmth is balanced.";

  const edgeLine =
    edge >= 0.75
      ? "Edge is strong but never cruel."
      : edge <= 0.35
      ? "Edge is low."
      : "Edge is moderate.";

  return `${toneLine} ${paceLine} ${warmthLine} ${edgeLine} Keep delivery natural, not robotic.`;
}

/**
 * Convert text to base64 mp3.
 * Blocks locked custom voices.
 */
async function textToSpeech(text, options = {}) {
  if (!text || typeof text !== "string") {
    throw new Error("textToSpeech: missing or invalid text");
  }

  const pack = getVoicePack(options.voicePackId);

  // Hard gate for anything custom/locked
  if (!pack.consentVerified) {
    const err = new Error(pack.lockedReason || "Voice pack locked.");
    err.code = "VOICE_PACK_LOCKED";
    throw err;
  }

  // For now we only support OpenAI TTS packs here.
  if (pack.provider !== "openai") {
    const err = new Error("Unsupported voice provider for this pack.");
    err.code = "VOICE_PROVIDER_UNSUPPORTED";
    throw err;
  }

  // If OpenAI key isn't set, voice is unavailable (but API should still run).
  if (!client) {
    const err = new Error("OpenAI TTS unavailable (missing OPENAI_API_KEY).");
    err.code = "OPENAI_KEY_MISSING";
    throw err;
  }

  const model = options.model || pack.model || "gpt-4o-mini-tts";
  const voice = options.voice || pack.voice || "coral";

  const instructions = buildDeliveryInstructions({
    toneMode: options.toneMode,
    delivery: options.delivery,
  });

  // Some SDK versions accept "instructions" for delivery shaping.
  // We'll try with instructions first, and if it errors, retry without.
  let mp3;
  try {
    mp3 = await client.audio.speech.create({
      model,
      voice,
      input: text,
      instructions,
    });
  } catch (e) {
    mp3 = await client.audio.speech.create({
      model,
      voice,
      input: text,
    });
  }

  const buffer = Buffer.from(await mp3.arrayBuffer());
  const base64 = buffer.toString("base64");

  return {
    audioBase64: base64,
    format: "mp3",
    voice,
    model,
    voicePack: {
      id: pack.id,
      label: pack.label,
    },
    instructions,
  };
}

function listVoicePacks() {
  // Deduplicate by canonical id (aliases share the same id)
  const byId = new Map();
  for (const p of Object.values(VOICE_PACKS)) {
    if (!byId.has(p.id)) {
      byId.set(p.id, {
        id: p.id,
        label: p.label,
        consentVerified: !!p.consentVerified,
        lockedReason: p.consentVerified ? null : p.lockedReason || "Locked",
      });
    }
  }
  return Array.from(byId.values());
}

module.exports = { textToSpeech, listVoicePacks };
