// services/chat.js

const crypto = require("crypto");
const { db } = require("../config/firebaseAdmin");
const { FieldValue, Timestamp } = require("firebase-admin/firestore");

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
  const members = pairData?.members;
  const unique = new Set();

  if (Array.isArray(members)) {
    for (const entry of members) {
      const memberId = normalizeString(entry);
      if (memberId) unique.add(memberId);
    }
    return Array.from(unique);
  }
  if (members && typeof members === "object") {
    for (const entry of Object.keys(members)) {
      const memberId = normalizeString(entry);
      if (memberId) unique.add(memberId);
    }
    return Array.from(unique);
  }
  return [];
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

async function assertPairMember(pairId, uid) {
  const pairRef = db.collection("pairs").doc(pairId);
  const userRef = db.collection("users").doc(uid);
  const [pairSnap, userSnap] = await Promise.all([pairRef.get(), userRef.get()]);

  if (!pairSnap.exists) {
    throw asKnownError("pair_not_found", 404);
  }

  const userData = userSnap.exists ? (userSnap.data() || {}) : {};
  const activePairId =
    normalizeString(userData.activePairId) ||
    normalizeString(userData.pairId) ||
    normalizeString(userData.pair?.id);
  if (activePairId !== pairId) {
    throw asKnownError("forbidden", 403);
  }

  const members = normalizePairMembers(pairSnap.data() || {});
  if (!members.includes(uid)) {
    throw asKnownError("forbidden", 403);
  }

  return pairRef;
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

  const pairRef = await assertPairMember(pairId, senderId);

  const resolvedMessageId =
    typeof messageId === "string" && messageId.trim().length > 0 ? messageId.trim() : generateMessageId();

  const userMessageRef = pairRef.collection("messages").doc(resolvedMessageId);
  const assistantMessageId = `assistant_${resolvedMessageId}`;
  const assistantMessageRef = pairRef.collection("messages").doc(assistantMessageId);
  const reply = buildDeterministicReply(normalizedText);
  const nowMs = Date.now();

  const resolvedReply = await db.runTransaction(async (tx) => {
    const [existingUser, existingAssistant] = await Promise.all([
      tx.get(userMessageRef),
      tx.get(assistantMessageRef),
    ]);

    if (!existingUser.exists) {
      tx.set(userMessageRef, {
        id: resolvedMessageId,
        role: "user",
        clientId: clientId || null,
        senderId,
        text: normalizedText,
        createdAtMs: nowMs,
        createdAt: FieldValue.serverTimestamp(),
        serverCreatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (!existingAssistant.exists) {
      tx.set(assistantMessageRef, {
        id: assistantMessageId,
        role: "assistant",
        senderId: "assistant",
        text: reply,
        createdAtMs: nowMs + 1,
        createdAt: FieldValue.serverTimestamp(),
        serverCreatedAt: FieldValue.serverTimestamp(),
      });
    }

    tx.set(pairRef, { updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    const existingReply = normalizeString(existingAssistant.data()?.text);
    return existingReply || reply;
  });

  return { reply: resolvedReply };
}

/**
 * List recent messages (newest first)
 * query: limit (default 30), before (serverCreatedAt millis)
 */
async function listMessages({ pairId, uid, limit = 30, before = null }) {
  const pairRef = await assertPairMember(pairId, uid);

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);

  let q = pairRef.collection("messages").orderBy("serverCreatedAt", "desc").limit(safeLimit);

  if (before) {
    const beforeMs = parseInt(before, 10);
    if (!Number.isNaN(beforeMs)) {
      q = q.where("serverCreatedAt", "<", Timestamp.fromMillis(beforeMs));
    }
  }

  const snap = await q.get();
  const messages = snap.docs
    .map((doc) => {
      const data = doc.data() || {};
      const text = normalizeString(data.text);
      if (!text) return null;

      const senderId = normalizeString(data.senderId);
      const role = data.role === "user" || data.role === "assistant"
        ? data.role
        : senderId === uid
          ? "user"
          : "assistant";

      const author = role === "assistant"
        ? "assistant"
        : senderId === uid
          ? "self"
          : "partner";

      const senderType = role === "assistant"
        ? "assistant"
        : senderId === uid
          ? "self"
          : senderId
            ? "partner"
            : "user";

      const createdAtMs =
        toMillis(data.createdAtMs) ??
        toMillis(data.serverCreatedAt) ??
        toMillis(data.createdAt) ??
        toMillis(data.sentAt) ??
        toMillis(data.timestamp) ??
        toMillis(data.time) ??
        toMillis(doc.createTime) ??
        toMillis(doc.updateTime) ??
        null;

      return {
        id: doc.id,
        role,
        author,
        senderId,
        senderType,
        createdAtMs,
        text,
      };
    })
    .filter(Boolean);

  return messages;
}

module.exports = {
  sendMessage,
  listMessages,
  assertPairMember,
};
