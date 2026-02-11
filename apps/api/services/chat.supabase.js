const store = require("./devSupabaseStore");

async function assertPairMember(pairId, uid) {
  const pair = store.getPair(pairId);
  if (!pair) {
    const err = new Error("pair_not_found");
    err.status = 404;
    throw err;
  }
  const member = pair.members?.[uid];
  if (!member || member.leftAt) {
    const err = new Error("forbidden");
    err.status = 403;
    throw err;
  }
  return pair;
}

async function sendMessage({ pairId, messageId, clientId, senderId, text }) {
  if (!text || typeof text !== "string") {
    const err = new Error("invalid_text");
    err.status = 400;
    throw err;
  }
  if (text.length > 4000) {
    const err = new Error("text_too_long");
    err.status = 400;
    throw err;
  }

  const pair = await assertPairMember(pairId, senderId);
  const existing = store.getMessages(pairId).find((m) => m.id === messageId);
  if (existing) return existing;

  const now = store.nowIso();
  const message = {
    id: messageId,
    clientId: clientId || null,
    senderId,
    text,
    createdAt: now,
    serverCreatedAt: now,
  };

  store.upsertMessage(pairId, message);
  store.setPair(pairId, { ...pair, updatedAt: now });
  return message;
}

async function listMessages({ pairId, uid, limit = 30, before = null }) {
  await assertPairMember(pairId, uid);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);

  let messages = store
    .getMessages(pairId)
    .sort((a, b) => new Date(b.serverCreatedAt).getTime() - new Date(a.serverCreatedAt).getTime());

  if (before) {
    const beforeMs = parseInt(before, 10);
    if (!Number.isNaN(beforeMs)) {
      messages = messages.filter((m) => new Date(m.serverCreatedAt).getTime() < beforeMs);
    }
  }

  messages = messages.slice(0, safeLimit);
  const nextBefore = messages.length ? new Date(messages[messages.length - 1].serverCreatedAt).getTime() : null;
  return { messages, nextBefore };
}

module.exports = { sendMessage, listMessages, assertPairMember };
