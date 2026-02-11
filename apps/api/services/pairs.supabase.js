const crypto = require("crypto");
const store = require("./devSupabaseStore");

function randomId(prefix = "pair") {
  const raw = crypto.randomBytes(12).toString("base64url");
  return `${prefix}_${raw}`;
}

function generateJoinCode() {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function ensureUserDoc(uid, authToken, overrides = {}) {
  const existing = store.getUser(uid);
  if (existing) return existing;

  const now = store.nowIso();
  const user = {
    uid,
    email: authToken?.email || null,
    displayName: authToken?.name || null,
    photoURL: authToken?.picture || null,
    activePairId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  return store.setUser(uid, user);
}

async function createPair(uid) {
  const user = store.getUser(uid);
  if (user?.activePairId) throw new Error("user_already_paired");

  const pairId = randomId("pair");
  const code = generateJoinCode();
  const now = store.nowIso();
  const pair = {
    id: pairId,
    code,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
    members: {
      [uid]: { role: "A", joinedAt: now, leftAt: null },
    },
  };

  store.setPair(pairId, pair);
  store.setUser(uid, { ...(user || { uid }), activePairId: pairId, updatedAt: now, createdAt: user?.createdAt || now });
  return { pairId, code };
}

async function joinPair(uid, code) {
  const pair = store.getPairByCode(code);
  if (!pair) {
    const err = new Error("pair_not_found");
    err.status = 404;
    throw err;
  }

  const user = store.getUser(uid);
  if (user?.activePairId) throw new Error("user_already_paired");
  if (pair.status === "ARCHIVED") {
    const err = new Error("pair_archived");
    err.status = 409;
    throw err;
  }

  const now = store.nowIso();
  const members = pair.members || {};
  const activeMemberIds = Object.keys(members).filter((id) => !members[id]?.leftAt);

  if (members[uid]) {
    members[uid].leftAt = null;
    members[uid].rejoinedAt = now;
  } else {
    if (activeMemberIds.length >= 2) {
      const err = new Error("pair_full");
      err.status = 409;
      throw err;
    }
    members[uid] = { role: Object.keys(members).length === 0 ? "A" : "B", joinedAt: now, leftAt: null };
  }

  pair.members = members;
  pair.status = Object.keys(members).filter((id) => !members[id]?.leftAt).length >= 2 ? "ACTIVE" : "PENDING";
  pair.updatedAt = now;
  store.setPair(pair.id, pair);
  store.setUser(uid, { ...(user || { uid }), activePairId: pair.id, updatedAt: now, createdAt: user?.createdAt || now });

  return { pairId: pair.id };
}

async function leaveActivePair(uid) {
  const user = store.getUser(uid);
  if (!user) {
    const err = new Error("user_not_found");
    err.status = 404;
    throw err;
  }

  const activePairId = user.activePairId || null;
  if (!activePairId) return { left: false, pairId: null };

  const pair = store.getPair(activePairId);
  const now = store.nowIso();
  if (!pair) {
    store.setUser(uid, { ...user, activePairId: null, updatedAt: now });
    return { left: false, pairId: activePairId };
  }

  if (!pair.members?.[uid] || pair.members[uid].leftAt) {
    store.setUser(uid, { ...user, activePairId: null, updatedAt: now });
    return { left: false, pairId: activePairId };
  }

  pair.members[uid].leftAt = now;
  const activeCount = Object.keys(pair.members).filter((id) => id !== uid && !pair.members[id]?.leftAt).length;
  const nextStatus = activeCount >= 2 ? "ACTIVE" : activeCount === 1 ? "PENDING" : "ARCHIVED";
  pair.status = nextStatus;
  pair.updatedAt = now;

  store.setPair(activePairId, pair);
  store.setUser(uid, { ...user, activePairId: null, updatedAt: now });

  return { left: true, pairId: activePairId, status: nextStatus };
}

async function getMyPair(uid) {
  const user = store.getUser(uid);
  const activePairId = user?.activePairId || null;
  if (!activePairId) return { pair: null };
  const pair = store.getPair(activePairId);
  if (!pair) return { pair: null };
  return { pair };
}

module.exports = { ensureUserDoc, createPair, joinPair, getMyPair, leaveActivePair };
