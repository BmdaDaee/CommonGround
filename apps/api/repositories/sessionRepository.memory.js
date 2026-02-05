// backend/repositories/sessionRepository.memory.js
const { randomUUID } = require("crypto");

const sessionsByUser = new Map();
const sessionsById = new Map();

async function getSession(userId) {
  return sessionsByUser.get(userId) || null;
}

async function getSessionById(sessionId) {
  return sessionsById.get(sessionId) || null;
}

async function createSession(userId) {
  const id = randomUUID();
  const now = Date.now();

  const session = {
    id,
    userId,
    history: [],
    toneState: null,
    mode: "checkin",
    patternTracker: { counts: {}, lastFired: null, firedTopics: {} },
    createdAt: now,
    updatedAt: now,
  };

  sessionsByUser.set(userId, session);
  sessionsById.set(id, session);
  return session;
}

async function appendMessage(sessionId, message) {
  const session = sessionsById.get(sessionId);
  if (!session) throw new Error("Session not found");

  session.history = Array.isArray(session.history) ? session.history : [];
  session.history.push(message);
  session.updatedAt = Date.now();

  return session;
}

async function updateSessionFields(sessionId, patch) {
  const session = sessionsById.get(sessionId);
  if (!session) throw new Error("Session not found");

  Object.assign(session, patch, { updatedAt: Date.now() });
  return session;
}

module.exports = {
  getSession,
  getSessionById,
  createSession,
  appendMessage,
  updateSessionFields,
};
