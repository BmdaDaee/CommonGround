/// backend/persona/emotionAnalysis.js

// Basic emotion analysis + tone mode detection for Shantell.
// Main export is a function: analyzeEmotion(text) -> { label, intensity }.
// It also exposes: analyzeEmotion.detectToneModeFromEmotion(emotion, text).

function analyzeEmotion(text) {
  if (!text || typeof text !== "string") {
    return { label: "neutral", intensity: 0.1 };
  }

  const lower = text.toLowerCase();

  const sadnessWords = [
    "tired",
    "exhausted",
    "drained",
    "empty",
    "numb",
    "hopeless",
    "don't feel like myself",
    "dont feel like myself",
    "done with everything",
    "over it",
    "everything feels heavy",
  ];

  const angerWords = [
    "bullshit",
    "pissed",
    "angry",
    "mad as hell",
    "sick of this",
    "fuck this",
    "same shit",
    "same bullshit",
  ];

  const anxietyWords = [
    "scared",
    "anxious",
    "nervous",
    "on edge",
    "panicking",
    "panic",
    "worried",
    "stressed",
    "stressing",
  ];

  const avoidanceWords = [
    "idk",
    "i dont know",
    "i don't know",
    "whatever",
    "it is what it is",
    "it’s whatever",
    "its whatever",
    "i guess",
  ];

  const crisisWords = [
    "kill myself",
    "hurt myself",
    "end it all",
    "suicide",
    "i don't want to live",
    "i dont want to live",
    "i want to die",
  ];

  function containsAny(words) {
    return words.some((w) => lower.includes(w));
  }

  // Crisis beats everything.
  if (containsAny(crisisWords)) {
    return { label: "danger", intensity: 1.0 };
  }

  const matches = [];
  if (containsAny(sadnessWords)) matches.push("sad");
  if (containsAny(angerWords)) matches.push("anger");
  if (containsAny(anxietyWords)) matches.push("anxiety");
  if (containsAny(avoidanceWords)) matches.push("avoidance");

  if (matches.length === 0) {
    return { label: "neutral", intensity: 0.2 };
  }

  // Crude intensity guess.
  let intensity = 0.5 + matches.length * 0.15;
  if (lower.includes(" so ") || lower.includes(" very ")) {
    intensity += 0.1;
  }
  if (lower.includes("really")) {
    intensity += 0.05;
  }
  intensity = Math.min(1.0, intensity);

  // Priority for choosing dominant emotion.
  const priority = ["danger", "anger", "sad", "anxiety", "avoidance", "neutral"];
  matches.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));
  const label = matches[0];

  return { label, intensity };
}

// Auto-tone logic based on emotion + message content.
// Returns one of: "soft" | "steady" | "push" | "crisis".
function detectToneModeFromEmotion(emotion, userMessage) {
  const text = (userMessage || "").toLowerCase();
  const label = (emotion && emotion.label) || "neutral";
  const intensity =
    emotion && typeof emotion.intensity === "number"
      ? emotion.intensity
      : 0.2;

  // Crisis override.
  if (
    label === "danger" ||
    text.includes("kill myself") ||
    text.includes("hurt myself") ||
    text.includes("suicide") ||
    text.includes("i want to die") ||
    text.includes("i dont want to live") ||
    text.includes("i don't want to live")
  ) {
    return "crisis";
  }

  // Soft: heavy, exhausted, collapsing.
  if (
    (label === "sad" && intensity >= 0.5) ||
    text.includes("i'm tired") ||
    text.includes("im tired") ||
    text.includes("i am so tired") ||
    text.includes("everything feels heavy") ||
    text.includes("i don't feel like myself") ||
    text.includes("i dont feel like myself") ||
    text.includes("i feel empty") ||
    text.includes("i give up")
  ) {
    return "soft";
  }

  // Push: anger, repetition, self-aware loops.
  if (
    label === "anger" ||
    intensity >= 0.8 ||
    text.includes("same bullshit") ||
    text.includes("same shit") ||
    text.includes("i keep doing this") ||
    /i (know|kno) but/i.test(text) ||
    text.includes("i know better but")
  ) {
    return "push";
  }

  // Steady: avoidance, deflection, "idk".
  if (
    label === "avoidance" ||
    text.includes("idk") ||
    text.includes("i don't know") ||
    text.includes("i dont know") ||
    text.includes("whatever") ||
    text.includes("it is what it is") ||
    text.includes("it’s whatever") ||
    text.includes("its whatever")
  ) {
    return "steady";
  }

  // Default based on intensity.
  if (intensity <= 0.3) {
    return "soft";
  }
  if (intensity <= 0.7) {
    return "steady";
  }
  return "push";
}

// Attach the detector as a property of the main function.
analyzeEmotion.detectToneModeFromEmotion = detectToneModeFromEmotion;

module.exports = analyzeEmotion;module.exports = analyzeEmotion;