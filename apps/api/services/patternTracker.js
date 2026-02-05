// backend/services/patternTracker.js
const store = new Map();

function ensureUser(userId) {
  if (!userId || typeof userId !== "string") {
    throw new Error("patternTracker: userId must be a non-empty string");
  }
  if (!store.has(userId)) {
    store.set(userId, { counts: {}, recent: [], lastEventAt: null });
  }
  return store.get(userId);
}

async function updatePattern(userId, type, meta = {}) {
  const user = ensureUser(userId);
  const safeType = typeof type === "string" && type.trim() ? type.trim() : "unknown";

  user.counts[safeType] = (user.counts[safeType] || 0) + 1;

  const entry = {
    type: safeType,
    ts: Date.now(),
    meta: meta && typeof meta === "object" ? meta : { value: meta },
  };

  user.recent.push(entry);
  user.lastEventAt = entry.ts;

  if (user.recent.length > 50) user.recent.splice(0, user.recent.length - 50);

  return { userId, ...user };
}

async function getPatternState(userId) {
  const user = ensureUser(userId);
  return { userId, ...user };
}

async function resetPatternState(userId) {
  if (!userId || typeof userId !== "string") throw new Error("patternTracker: invalid userId");
  store.delete(userId);
  return { ok: true };
}

module.exports = { updatePattern, getPatternState, resetPatternState };