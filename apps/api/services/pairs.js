// services/pairs.js

const crypto = require("crypto");
const { db } = require("../config/firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

function randomId(prefix = "pair") {
  // 20 chars url-safe-ish
  const raw = crypto.randomBytes(12).toString("base64url");
  return `${prefix}_${raw}`;
}

function generateJoinCode() {
  // Human-friendly, no confusing chars (O/0, I/1).
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function getActivePairId(user = null) {
  if (!user || typeof user !== "object") return null;
  const activePairId = user.activePairId || user.pairId || null;
  return typeof activePairId === "string" && activePairId.trim() ? activePairId : null;
}

function withPairAliases(user = null) {
  const safeUser = user && typeof user === "object" ? user : {};
  const activePairId = getActivePairId(safeUser);
  return {
    ...safeUser,
    activePairId,
    pairId: activePairId,
  };
}

async function ensureUserDoc(uid, authToken, overrides = {}) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (snap.exists) return withPairAliases(snap.data());

  const now = FieldValue.serverTimestamp();
  const data = {
    uid,
    email: authToken?.email || null,
    displayName: authToken?.name || null,
    photoURL: authToken?.picture || null,
    activePairId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  await ref.set(data, { merge: true });
  // Re-read so callers get real timestamps (not FieldValue sentinels)
  const created = await ref.get();
  return withPairAliases(created.data());
}

/**
 * Creates a new pair with the caller as the first member.
 * Returns { pairId, code }
 */
async function createPair(uid) {
  const pairId = randomId("pair");
  const code = generateJoinCode();
  const pairRef = db.collection("pairs").doc(pairId);
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (userSnap.exists && getActivePairId(userSnap.data())) {
      throw new Error("user_already_paired");
    }

    tx.set(pairRef, {
      id: pairId,
      code,
      status: "PENDING", // PENDING | ACTIVE
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      members: {
        [uid]: {
          role: "A",
          joinedAt: FieldValue.serverTimestamp(),
          leftAt: null,
        },
      },
    });

    tx.set(
      userRef,
      {
        activePairId: pairId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return { pairId, code };
}

/**
 * Joins an existing pair by join code.
 * Returns { pairId }
 */
async function joinPair(uid, code) {
  const userRef = db.collection("users").doc(uid);

  // Find pair by code (simple where; acceptable at this scale).
  const match = await db
    .collection("pairs")
    .where("code", "==", code)
    .limit(1)
    .get();

  if (match.empty) {
    const err = new Error("pair_not_found");
    err.status = 404;
    throw err;
  }

  const pairRef = match.docs[0].ref;
  const pairId = match.docs[0].id;

  await db.runTransaction(async (tx) => {
    const [pairSnap, userSnap] = await Promise.all([tx.get(pairRef), tx.get(userRef)]);
    if (!pairSnap.exists) throw new Error("pair_not_found");

    const pairData = pairSnap.data() || {};
    if (pairData.status === "ARCHIVED") {
      const err = new Error("pair_archived");
      err.status = 409;
      throw err;
    }

    const userData = userSnap.exists ? userSnap.data() : null;
    if (getActivePairId(userData)) throw new Error("user_already_paired");

    const members = pairData.members || {};
    const memberIds = Object.keys(members);
    const activeMemberIds = memberIds.filter((id) => !members?.[id]?.leftAt);

    if (members[uid]) {
      // Re-join or idempotent join.
      tx.update(pairRef, {
        [`members.${uid}.leftAt`]: null,
        [`members.${uid}.rejoinedAt`]: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(userRef, { activePairId: pairId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }

    if (activeMemberIds.length >= 2) {
      const err = new Error("pair_full");
      err.status = 409;
      throw err;
    }

    const role = memberIds.includes(uid) ? "B" : memberIds.length === 0 ? "A" : "B";

    tx.update(pairRef, {
      [`members.${uid}`]: {
        role,
        joinedAt: FieldValue.serverTimestamp(),
        leftAt: null,
      },
      status: activeMemberIds.length + 1 >= 2 ? "ACTIVE" : "PENDING",
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(
      userRef,
      { activePairId: pairId, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  });

  return { pairId };
}

/**
 * Leaves the current active pair.
 * - Clears user.activePairId
 * - Sets members.{uid}.leftAt
 * - Recomputes pair.status (PENDING/ACTIVE/ARCHIVED)
 */
async function leaveActivePair(uid) {
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      const err = new Error("user_not_found");
      err.status = 404;
      throw err;
    }

    const activePairId = getActivePairId(userSnap.data());
    if (!activePairId) return { left: false, pairId: null };

    const pairRef = db.collection("pairs").doc(activePairId);
    const pairSnap = await tx.get(pairRef);
    if (!pairSnap.exists) {
      // User points to a missing pair; clear it.
      tx.set(userRef, { activePairId: null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return { left: false, pairId: activePairId };
    }

    const pairData = pairSnap.data() || {};
    const members = pairData.members || {};
    if (!members[uid] || members[uid].leftAt) {
      tx.set(userRef, { activePairId: null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return { left: false, pairId: activePairId };
    }

    // Mark member as left
    tx.update(pairRef, {
      [`members.${uid}.leftAt`]: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Clear user active pair
    tx.set(userRef, { activePairId: null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    // Recompute pair status based on active members (excluding the leaver)
    const activeCount = Object.keys(members).filter((id) => id !== uid && !members?.[id]?.leftAt).length;
    const nextStatus = activeCount >= 2 ? "ACTIVE" : activeCount === 1 ? "PENDING" : "ARCHIVED";
    tx.update(pairRef, { status: nextStatus, updatedAt: FieldValue.serverTimestamp() });

    return { left: true, pairId: activePairId, status: nextStatus };
  });
}

async function getMyPair(uid) {
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) return { pair: null };
  const activePairId = getActivePairId(userSnap.data());
  if (!activePairId) return { pair: null };
  const pairSnap = await db.collection("pairs").doc(activePairId).get();
  if (!pairSnap.exists) return { pair: null };
  return { pair: { id: pairSnap.id, ...pairSnap.data() } };
}

module.exports = {
  ensureUserDoc,
  createPair,
  joinPair,
  getMyPair,
  leaveActivePair,
};
