// services/router.js

const { askPersona } = require("./ai");
const { CONTENT_LEVELS } = require("../config/contentLevels");

/**
 * routeAIRequest
 *  - user: { id, isAdult, nsfwEnabled } (for now, simple object)
 *  - contentLevel: one of CONTENT_LEVELS
 *  - intentType: string label if you want later (e.g. "INTIMACY", "CONFLICT")
 *  - message: user input text
 */
async function routeAIRequest({ user, contentLevel, intentType, message }) {
  const level = contentLevel || CONTENT_LEVELS.SAFE;

  // Safety: if it's explicit, block it from OpenAI & respond with placeholder
  if (level === CONTENT_LEVELS.EXPLICIT) {
    // Age & NSFW checks (basic version)
    if (!user || !user.isAdult) {
      return "This feature is only available for adult users.";
    }

    if (!user.nsfwEnabled) {
      return "You haven't enabled adult tools in your settings yet. For now, I can help you talk about this in a non-explicit, safer way.";
    }

    // Placeholder until you build Engine B
    return "The adults-only tools aren't enabled yet. I can still help you explore this in a non-explicit way and improve how you talk about it with your partner.";
  }

  // If SAFE or SUGGESTIVE, use the persona engine (OpenAI)
  if (level === CONTENT_LEVELS.SAFE || level === CONTENT_LEVELS.SUGGESTIVE) {
    return await askPersona(message);
  }

  // Paranoid default: treat unknown as SAFE
  return await askPersona(message);
}

module.exports = {
  routeAIRequest,
};async function handleMessage(userInput, session) {
  const aiOutput = await askPersona(userInput);
  return aiOutput;
}

module.exports = {
  routeAIRequest,
  handleMessage,
};