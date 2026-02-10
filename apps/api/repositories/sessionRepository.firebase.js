// backend/repositories/sessionRepository.firebase.js
const { getFirestoreDb } = require("../config/firestore");

const db = getFirestoreDb();
const col = db.collection("sessions");

async function getSession(userId) {
  const snap = await col.where("userId", "==", userId).limit(1).get();
  if (snap.empty) return null;

  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function getSessionById(sessionId) {
  const doc = await col.doc(sessionId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function createSession(userId) {
  const now = Date.now();
  const session = {
    userId,
    history: [],
    toneState: null,
    mode: "checkin",
    patternTracker: { counts: {}, lastFired: null, firedTopics: {} },
    createdAt: now,
    updatedAt: now,
  };

  const ref = await col.add(session);
  return { id: ref.id, ...session };
}

async function appendMessage(sessionId, message) {
  const ref = col.doc(sessionId);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new Error("Session not found");

    const data = doc.data();
    const history = Array.isArray(data.history) ? data.history : [];
    history.push(message);

    tx.update(ref, { history, updatedAt: Date.now() });
  });

  return getSessionById(sessionId);
}

async function updateSessionFields(sessionId, patch) {
  const ref = col.doc(sessionId);
  await ref.update({ ...patch, updatedAt: Date.now() });
  return getSessionById(sessionId);
}

module.exports = {
  getSession,
  getSessionById,
  createSession,
  appendMessage,
  updateSessionFields,
};
