// backend/services/session.js
const sessions = require("../repositories/sessionRepository");
const { updatePattern } = require("./patternTracker");

async function getOrCreateSession(userId) {
  let session = await sessions.getSession(userId);
  if (!session) {
    session = await sessions.createSession(userId);
    await updatePattern(userId, "session-started", { sessionId: session.id });
  }
  return session;
}

async function updateSession(sessionId, role, content) {
  if (!sessionId) throw new Error("Missing sessionId");
  if (role !== "user" && role !== "assistant") throw new Error("Invalid role");
  if (typeof content !== "string") throw new Error("Content must be a string");

  const updated = await sessions.appendMessage(sessionId, { role, content, ts: Date.now() });

  if (role === "user") {
    await updatePattern(updated.userId, "prompt", { prompt: content });
  }

  return updated;
}

async function updateSessionFields(sessionId, patch) {
  return sessions.updateSessionFields(sessionId, patch);
}

async function getSessionById(sessionId) {
  return sessions.getSessionById(sessionId);
}

module.exports = {
  getOrCreateSession,
  updateSession,
  updateSessionFields,
  getSessionById,
};