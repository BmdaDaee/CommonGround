// persona/toneMix.js

function toneMix({ base, context, emotion, micro }) {
  const out = JSON.parse(JSON.stringify(base));

  switch (context.mode) {
    case "conflict":
      out.style.warmth += 0.05;
      out.style.directness += 0.1;
      out.style.humor -= 0.05;
      break;

    case "connection":
    case "intimacy":
      out.style.warmth += 0.15;
      out.style.directness -= 0.05;
      break;

    case "logistics":
      out.style.directness += 0.15;
      out.style.warmth -= 0.05;
      break;

    default:
      // general stays balanced
      break;
  }

  // clamp 0–1
  Object.keys(out.style).forEach((k) => {
    if (typeof out.style[k] === "number") {
      out.style[k] = Math.max(0, Math.min(1, out.style[k]));
    }
  });

  out.context = context;
  out.emotion = emotion;
  out.micro = micro;

  return out;
}

module.exports = toneMix;