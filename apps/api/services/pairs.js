// services/pairs.js

const crypto = require("crypto");
const { db } = require("../config/firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

const CREATE_PAIR_MAX_ATTEMPTS = 10;

function randomId(prefix = "pair") {
  const raw = crypto.randomBytes(12).toString("base64url");
  return `${prefix}_${raw}`;
}

function generateJoinCode() {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function normalizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePairRole(value) {
  const role = normalizeString(value);
  if (role === "a" || role === "b") return role;
  return null;
}

function getActivePairId(user = null) {
  if (!user || typeof user !== "object") return null;
  return normalizeString(user.activePairId || user.pairId || null);
}

function getPairMemberIds(pairData) {
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

function withNormalizedPairFields(user = null) {
  const safeUser = user && typeof user === "object" ? user : {};
  return {
    ...safeUser,
    activePairId: getActivePairId(safeUser),
    pairRole: normalizePairRole(safeUser.pairRole),
  };
}

function asKnownError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function ensureUserDoc(uid, authToken, overrides = {}) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    const normalized = withNormalizedPairFields(snap.data());
    const patch = {};
    if (snap.data()?.activePairId !== normalized.activePairId) patch.activePairId = normalized.activePairId;
    if (snap.data()?.pairRole !== normalized.pairRole) patch.pairRole = normalized.pairRole;

    if (Object.keys(patch).length > 0) {
      patch.updatedAt = FieldValue.serverTimestamp();
      await ref.set(patch, { merge: true });
      const updated = await ref.get();
      return withNormalizedPairFields(updated.data());
    }
    return normalized;
  }

  const now = FieldValue.serverTimestamp();
  const data = {
    uid,
    email: authToken?.email || null,
    displayName: authToken?.name || null,
    photoURL: authToken?.picture || null,
    activePairId: null,
    pairRole: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  await ref.set(data, { merge: true });
  const created = await ref.get();
  return withNormalizedPairFields(created.data());
}

async function createPair(uid) {
  const userRef = db.collection("users").doc(uid);

  for (let attempt = 0; attempt < CREATE_PAIR_MAX_ATTEMPTS; attempt += 1) {
    const pairId = randomId("pair");
    const code = generateJoinCode();
    const pairRef = db.collection("pairs").doc(pairId);

    try {
      await db.runTransaction(async (tx) => {
        const codeQuery = db.collection("pairs").where("code", "==", code).limit(1);
        const [userSnap, codeSnap] = await Promise.all([tx.get(userRef), tx.get(codeQuery)]);

        const existingUser = userSnap.exists ? withNormalizedPairFields(userSnap.data()) : null;
        if (existingUser?.activePairId) {
          throw asKnownError("user_already_paired", 409);
        }

        if (!codeSnap.empty) {
          throw asKnownError("code_collision", 409);
        }

        const now = FieldValue.serverTimestamp();
        tx.set(pairRef, {
          code,
          members: [uid],
          status: "pending",
          createdAt: now,
          updatedAt: now,
          joinedAt: null,
        });

        const userPatch = {
          activePairId: pairId,
          pairRole: "a",
          updatedAt: now,
        };

        if (!userSnap.exists) {
          userPatch.uid = uid;
          userPatch.activePairId = pairId;
          userPatch.pairRole = "a";
          userPatch.createdAt = now;
        }

        tx.set(userRef, userPatch, { merge: true });
      });

      return { ok: true, pairId, code };
    } catch (err) {
      if (err?.message === "code_collision") {
        continue;
      }
      throw err;
    }
  }

  throw asKnownError("create_pair_failed", 500);
}

async function joinPair(uid, rawCode) {
  const code = normalizeString(rawCode)?.toUpperCase();
  if (!code) {
    throw asKnownError("missing_code", 400);
  }

  const userRef = db.collection("users").doc(uid);
  let joinedPairId = null;

  await db.runTransaction(async (tx) => {
    const codeQuery = db.collection("pairs").where("code", "==", code).limit(1);
    const [userSnap, match] = await Promise.all([tx.get(userRef), tx.get(codeQuery)]);

    if (match.empty) {
      throw asKnownError("pair_not_found", 404);
    }

    const pairSnap = match.docs[0];
    const pairRef = pairSnap.ref;
    const pairId = pairSnap.id;
    joinedPairId = pairId;

    const pairData = pairSnap.data() || {};
    const members = getPairMemberIds(pairData);
    const alreadyMember = members.includes(uid);

    const userData = userSnap.exists ? withNormalizedPairFields(userSnap.data()) : null;
    if (userData?.activePairId && userData.activePairId !== pairId) {
      throw asKnownError("user_already_paired", 409);
    }

    if (!alreadyMember && members.length >= 2) {
      throw asKnownError("pair_full", 409);
    }

    const nextMembers = alreadyMember ? members : [...members, uid];
    const nextStatus = nextMembers.length >= 2 ? "active" : "pending";
    const now = FieldValue.serverTimestamp();
    const pairPatch = {
      members: nextMembers,
      status: nextStatus,
      updatedAt: now,
    };

    if (nextStatus === "active" && !pairData.joinedAt) {
      pairPatch.joinedAt = now;
    }

    tx.set(pairRef, pairPatch, { merge: true });

    const role = nextMembers[0] === uid ? "a" : "b";
    const userPatch = {
      activePairId: pairId,
      pairRole: role,
      updatedAt: now,
    };

    if (!userSnap.exists) {
      userPatch.uid = uid;
      userPatch.createdAt = now;
    }

    tx.set(userRef, userPatch, { merge: true });
  });

  return { ok: true, pairId: joinedPairId };
}

async function leaveActivePair(uid) {
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw asKnownError("user_not_found", 404);
    }

    const userData = withNormalizedPairFields(userSnap.data());
    if (!userData.activePairId) {
      return { left: false, pairId: null };
    }

    const pairRef = db.collection("pairs").doc(userData.activePairId);
    const pairSnap = await tx.get(pairRef);
    const now = FieldValue.serverTimestamp();

    tx.set(userRef, { activePairId: null, pairRole: null, updatedAt: now }, { merge: true });

    if (!pairSnap.exists) {
      return { left: false, pairId: userData.activePairId };
    }

    const pairData = pairSnap.data() || {};
    const members = getPairMemberIds(pairData);
    const nextMembers = members.filter((memberId) => memberId !== uid);
    const nextStatus = nextMembers.length >= 2 ? "active" : "pending";

    tx.set(
      pairRef,
      {
        members: nextMembers,
        status: nextStatus,
        joinedAt: nextMembers.length >= 2 ? pairData.joinedAt || now : null,
        updatedAt: now,
      },
      { merge: true }
    );

    return { left: true, pairId: userData.activePairId, status: nextStatus };
  });
}

async function getMyPair(uid) {
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) return { pair: null };

  const user = withNormalizedPairFields(userSnap.data());
  if (!user.activePairId) return { pair: null };

  const pairSnap = await db.collection("pairs").doc(user.activePairId).get();
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
