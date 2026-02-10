// services/chat.js

const crypto = require("crypto");
const { createMessageStore } = require("./chatMessageStore");
const { createPairStore, getPairMemberIds } = require("./pairStore");

const messageStore = createMessageStore();
const pairStore = createPairStore();

function generateMessageId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `msg_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
}

function normalizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePairMembers(pairData) {
  return getPairMemberIds(pairData);
}

function toMillis(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (!Number.isFinite(numeric)) return null;
      const abs = Math.abs(numeric);
      if (abs >= 1e17) return Math.trunc(numeric / 1e6); // ns -> ms
      if (abs >= 1e14) return Math.trunc(numeric / 1e3); // us -> ms
      if (abs < 1e11) return Math.trunc(numeric * 1e3); // s -> ms
      return Math.trunc(numeric); // already ms
    }

    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (!value || typeof value !== "object") return null;

  if (typeof value.toMillis === "function") {
    try {
      return value.toMillis();
    } catch {
      // Fall through
    }
  }

  const seconds = Number(value.seconds ?? value._seconds);
  if (Number.isFinite(seconds)) {
    const nanos = Number(value.nanoseconds ?? value._nanoseconds ?? 0);
    const millisFromNanos = Number.isFinite(nanos) ? Math.floor(nanos / 1e6) : 0;
    return seconds * 1000 + millisFromNanos;
  }

  return null;
}

function asKnownError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function buildDeterministicReply(text) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "Thanks for checking in.";
  const clipped = compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
  return `Thanks for sharing. I heard: "${clipped}"`;
}

function resolveAuthorForViewer(message, uid) {
  const senderId = normalizeString(message?.senderId) || "";
  const storedAuthor = normalizeString(message?.author);

  if (storedAuthor === "assistant" || senderId === "assistant") return "assistant";
  if (senderId && uid) return senderId === uid ? "self" : "partner";

  if (storedAuthor === "self" || storedAuthor === "partner") return storedAuthor;
  return "assistant";
}

function toClientMessage(message, uid) {
  if (!message || typeof message !== "object") return null;

  const text = normalizeString(message.text);
  if (!text) return null;

  const senderId = normalizeString(message.senderId);
  const author = resolveAuthorForViewer(message, uid);
  const role = author === "assistant" ? "assistant" : "user";
  const senderType = author === "assistant"
    ? "assistant"
    : author === "self"
      ? "self"
      : senderId
        ? "partner"
        : "user";

  return {
    id: normalizeString(message.id) || generateMessageId(),
    role,
    author,
    senderId,
    senderType,
    createdAtMs: toMillis(message.createdAtMs),
    text,
  };
}

async function assertPairMember(pairId, uid) {
  const [pair, userData] = await Promise.all([pairStore.getPairById(pairId), pairStore.getUser(uid)]);

  if (!pair) {
    throw asKnownError("pair_not_found", 404);
  }

  const activePairId =
    normalizeString(userData?.activePairId) ||
    normalizeString(userData?.pairId) ||
    normalizeString(userData?.pair?.id);
  if (activePairId !== pairId) {
    throw asKnownError("forbidden", 403);
  }

  const members = normalizePairMembers(pair);
  if (!members.includes(uid)) {
    throw asKnownError("forbidden", 403);
  }

  return pair;
}

/**
 * Idempotent message send:
 * - client provides messageId (uuid)
 * - if message doc already exists, returns it instead of creating a duplicate
 */
async function sendMessage({ pairId, messageId, clientId, senderId, text }) {
  if (!text || typeof text !== "string") {
    throw asKnownError("invalid_text", 400);
  }

  const normalizedText = text.trim();
  if (!normalizedText) {
    throw asKnownError("invalid_text", 400);
  }
  if (normalizedText.length > 4000) {
    throw asKnownError("text_too_long", 400);
  }

  await assertPairMember(pairId, senderId);

  const resolvedMessageId =
    typeof messageId === "string" && messageId.trim().length > 0 ? messageId.trim() : generateMessageId();

  const assistantMessageId = `assistant_${resolvedMessageId}`;
  const reply = buildDeterministicReply(normalizedText);
  const nowMs = Date.now();

  await messageStore.sendMessage(pairId, senderId, "self", normalizedText, {
    id: resolvedMessageId,
    clientId,
    createdAtMs: nowMs,
  });

  const assistantMessage = await messageStore.sendMessage(pairId, "assistant", "assistant", reply, {
    id: assistantMessageId,
    createdAtMs: nowMs + 1,
  });

  const resolvedReply = normalizeString(assistantMessage?.text) || reply;

  return { reply: resolvedReply };
}

/**
 * List recent messages (newest first)
 * query: limit (default 30), before (serverCreatedAt millis)
 */
async function listMessages({ pairId, uid, limit = 30, before = null }) {
  await assertPairMember(pairId, uid);

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);
  const parsedBefore = before === undefined || before === null ? null : toMillis(before);

  const messages = await messageStore.listMessages(pairId, {
    limit: safeLimit,
    beforeMs: parsedBefore,
  });

  return messages.map((message) => toClientMessage(message, uid)).filter(Boolean);
}

module.exports = {
  sendMessage,
  listMessages,
  assertPairMember,
};
