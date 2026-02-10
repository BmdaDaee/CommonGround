// services/chat.js

const crypto = require("crypto");
const { db } = require("../config/firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

function generateMessageId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `msg_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
}

async function assertPairMember(pairId, uid) {
  const pairSnap = await db.collection("pairs").doc(pairId).get();
  if (!pairSnap.exists) {
    const err = new Error("pair_not_found");
    err.status = 404;
    throw err;
  }
  const members = pairSnap.data()?.members || {};
  const m = members[uid];
  if (!m || m.leftAt) {
    const err = new Error("forbidden");
    err.status = 403;
    throw err;
  }
  return pairSnap;
}

/**
 * Idempotent message send:
 * - client provides messageId (uuid)
 * - if message doc already exists, returns it instead of creating a duplicate
 */
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

  await assertPairMember(pairId, senderId);

  const resolvedMessageId =
    typeof messageId === "string" && messageId.trim().length > 0 ? messageId.trim() : generateMessageId();

  const msgRef = db.collection("pairs").doc(pairId).collection("messages").doc(resolvedMessageId);

  const result = await db.runTransaction(async (tx) => {
    const existing = await tx.get(msgRef);
    if (existing.exists) return existing.data();

    const data = {
      id: resolvedMessageId,
      clientId: clientId || null,
      senderId,
      text,
      createdAt: FieldValue.serverTimestamp(),
      serverCreatedAt: FieldValue.serverTimestamp(),
    };
    tx.set(msgRef, data);

    // light analytics bump
    tx.set(
      db.collection("pairs").doc(pairId),
      { updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return data;
  });

  return result;
}

/**
 * List recent messages (newest first)
 * query: limit (default 30), before (serverCreatedAt millis)
 */
async function listMessages({ pairId, uid, limit = 30, before = null }) {
  await assertPairMember(pairId, uid);

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);

  let q = db
    .collection("pairs")
    .doc(pairId)
    .collection("messages")
    .orderBy("serverCreatedAt", "desc")
    .limit(safeLimit);

  if (before) {
    const beforeMs = parseInt(before, 10);
    if (!Number.isNaN(beforeMs)) {
      // We store serverCreatedAt as a timestamp, so compare with a Timestamp.
      const { Timestamp } = require("firebase-admin/firestore");
      q = q.startAfter(Timestamp.fromMillis(beforeMs));
    }
  }

  const snap = await q.get();
  const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // pagination cursor: last doc serverCreatedAt
  const last = snap.docs[snap.docs.length - 1];
  const nextBefore = last ? last.data()?.serverCreatedAt?.toMillis?.() || null : null;

  return { messages, nextBefore };
}

module.exports = {
  sendMessage,
  listMessages,
  assertPairMember,
};
