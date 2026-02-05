// config/contentLevels.js
// This keeps your content routing clean and predictable across the entire app.

const CONTENT_LEVELS = {
  SAFE: "SAFE",               
  // Emotional support, conflict resolution, general relationship talk.
  // OpenAI-friendly. Zero sexual content.

  SUGGESTIVE: "SUGGESTIVE",   
  // Flirty, romantic, intimacy-adjacent, but NON-EXPLICIT.
  // Safe for OpenAI. No graphic details allowed.

  EXPLICIT: "EXPLICIT",       
  // Adults-only explicit content.
  // Must NEVER go to OpenAI. Routed to your separate sensitive engine.
};

module.exports = {
  CONTENT_LEVELS,
};