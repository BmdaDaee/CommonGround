// backend/services/voice.js
const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Voice packs: "inspired" ones are allowed.
 * "custom" packs must be consentVerified=true or they are blocked.
 */
const VOICE_PACKS = {
  shantell_inspired: {
    id: "shantell_inspired",
    label: "BentlyAI (Inspired)",
    provider: "openai",
    voice: "coral", // placeholder, swap later
    model: "gpt-4o-mini-tts",
    consentVerified: true,
    lockedReason: null,
  },

  // Example placeholder for future legit custom voice
  shantell_custom_locked: {
    id: "shantell_custom_locked",
    label: "Custom BentlyAI (Locked)",
    provider: "custom",
    voice: null,
    model: null,
    consentVerified: false,
    lockedReason: "Custom voice is locked until consent/rights are verified.",
  },
};

function getVoicePack(voicePackId) {
  if (!voicePackId) return VOICE_PACKS.shantell_inspired;
  return VOICE_PACKS[voicePackId] || VOICE_PACKS.shantell_inspired;
}

/**
 * Build speech delivery instructions that match BentlyAI’s vibe + toneMode.
 * Keep it short. Instructions help pacing/emphasis.
 */
function buildDeliveryInstructions({ toneMode, delivery }) {
  const d = delivery || {};
  const pace = d.pace || "medium"; // slow | medium | fast
  const warmth = typeof d.warmth === "number" ? d.warmth : 0.5; // 0..1
  const edge = typeof d.edge === "number" ? d.edge : 0.7; // 0..1

  // Tone-specific delivery guidance
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

  // Pace guidance
  let paceLine = "";
  if (pace === "slow") paceLine = "Speak slower with more pauses.";
  else if (pace === "fast") paceLine = "Speak faster, tight and snappy.";
  else paceLine = "Speak at a natural conversational pace.";

  // Warmth/edge guidance
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
 * Convert text to base64 mp3. Blocks locked custom voices.
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

  const model = options.model || pack.model || "gpt-4o-mini-tts";
  const voice = options.voice || pack.voice || "coral";

  const instructions = buildDeliveryInstructions({
    toneMode: options.toneMode,
    delivery: options.delivery,
  });

  // Some SDK versions accept "instructions" for delivery shaping.
  // If your SDK complains, remove the instructions field.
  const mp3 = await client.audio.speech.create({
    model,
    voice,
    input: text,
    instructions,
  });

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
  return Object.values(VOICE_PACKS).map((p) => ({
    id: p.id,
    label: p.label,
    consentVerified: !!p.consentVerified,
    lockedReason: p.consentVerified ? null : p.lockedReason || "Locked",
  }));
}

module.exports = { textToSpeech, listVoicePacks };