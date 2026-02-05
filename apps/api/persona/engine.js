// backend/persona/engine.js

const { getSystemPrompt } = require("./systemPrompt");

// Firm, consistent voice (recommended default)
const CALLOUTS = {
  "money|money|tired":
    "I’m noticing a pattern: when money comes up, you get tired and shut down. That makes sense, but it also keeps the stress stuck. One small decision today is better than avoiding it altogether.",

  "conflict|conflict|overwhelmed":
    "I’m noticing a pattern: when things get tense, you call it being overwhelmed and go quiet. That pause can help, but only if you come back and say what you’re actually feeling.",

  "intimacy|intimacy|numb":
    "I’m noticing a pattern: when intimacy comes up, you say you feel numb and pull away. That’s understandable, but it also keeps you disconnected from what you want to feel.",
};

// Used as fallback when emotion fluctuates but topic is stable
const TOPIC_DEFAULT_CALLOUT_KEY = {
  money: "money|money|tired",
  conflict: "conflict|conflict|overwhelmed",
  intimacy: "intimacy|intimacy|numb",
};

function inferMode(text, currentMode = "checkin") {
  if (/\bmoney\b|\bbills?\b|\brent\b|\bpay\b|\bjob\b|\bincome\b/.test(text)) return "money";
  if (/\bfight\b|\bargue\b|\bconflict\b|\btension\b|\bmad\b|\bangry\b/.test(text)) return "conflict";
  if (/\bsex\b|\bintimacy\b|\baffection\b|\btouch\b|\bdisconnect(ed)?\b|\bnumb\b/.test(text)) return "intimacy";
  return currentMode || "checkin";
}

function detectToneState(message, session) {
  const text = (message || "").toLowerCase();

  const mode = inferMode(text, session.mode || "checkin");
  const topic = mode;

  let emotion = "neutral";
  let toneMode = "steady";

  // Make "overwhelmed" more resilient to phrasing
  const overwhelmedSignals = /overwhelmed|too much|shut ?down|freeze|can('t|not) (talk|speak)|go quiet|avoid(ing)?|panic|flooded/;
  const tiredSignals = /tired|exhausted|drained/;
  const numbSignals = /numb|disconnected|nothing|empty/;

  if (tiredSignals.test(text)) emotion = "tired";
  if (overwhelmedSignals.test(text)) emotion = "overwhelmed"; // override tired if both
  if (numbSignals.test(text)) emotion = "numb"; // strongest override

  if (emotion === "numb") toneMode = "push";

  session.mode = mode; // server-authoritative session state
  return { mode, topic, emotion, toneMode };
}

/**
 * Per-topic-per-session cooldown:
 * - Count per TOPIC (not per emotion), because emotion is noisy
 * - Fire once per topic per session
 * - Still store key-counts for visibility/debugging
 */
function checkPatternCallout(session, toneState) {
  const key = `${toneState.mode}|${toneState.topic}|${toneState.emotion}`;
  const topic = toneState.topic;

  if (!session.patternTracker) {
    session.patternTracker = {
      counts: {},        // per key counts (debug)
      topicCounts: {},   // per topic counts (trigger)
      lastFired: null,
      firedTopics: {},
    };
  }

  const tracker = session.patternTracker;

  if (!tracker.counts || typeof tracker.counts !== "object") tracker.counts = {};
  if (!tracker.topicCounts || typeof tracker.topicCounts !== "object") tracker.topicCounts = {};
  if (!tracker.firedTopics || typeof tracker.firedTopics !== "object") tracker.firedTopics = {};

  // always increment debug key-count
  tracker.counts[key] = (tracker.counts[key] || 0) + 1;

  // increment topic count (this is what triggers)
  tracker.topicCounts[topic] = (tracker.topicCounts[topic] || 0) + 1;

  // already fired for this topic in this session
  if (tracker.firedTopics[topic]) return null;

  // Fire on 3rd mention of topic this session
  if (tracker.topicCounts[topic] === 3) {
    // prefer exact key copy if available, else fallback to topic default
    const bestKey = CALLOUTS[key] ? key : TOPIC_DEFAULT_CALLOUT_KEY[topic];
    const text = CALLOUTS[bestKey];

    // if somehow missing copy, don't fire
    if (!text) return null;

    tracker.lastFired = bestKey;
    tracker.firedTopics[topic] = true;

    return { key: bestKey, topic, text };
  }

  return null;
}

async function buildPrompt(message, session) {
  const toneState = detectToneState(message, session);
  const callout = checkPatternCallout(session, toneState);

  let systemPrompt = getSystemPrompt({ calloutShown: !!callout, vibe: session?.vibe || "realtalk" });

  if (callout) toneState.toneMode = "push";

  const historyStr = (session.history || [])
    .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `
${systemPrompt}

Conversation so far:
${historyStr || "None"}

USER: ${message}
ASSISTANT:
`.trim();

  const meta = callout
    ? { callout: { key: callout.key, topic: callout.topic, text: callout.text } }
    : {};

  return { prompt, toneState, meta };
}

module.exports = { buildPrompt, getSystemPrompt };