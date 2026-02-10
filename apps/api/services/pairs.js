// services/pairs.js

const { createPairStore } = require("./pairStore");

const pairStore = createPairStore();

function asKnownError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function ensureUserDoc(uid, authToken, overrides = {}) {
  return pairStore.ensureUser(uid, authToken, overrides);
}

async function createPair(uid) {
  return pairStore.createPair(uid);
}

async function joinPair(uid, rawCode) {
  return pairStore.joinPair(uid, rawCode);
}

async function leaveActivePair(uid) {
  const user = await pairStore.getUser(uid);
  if (!user) throw asKnownError("user_not_found", 404);

  if (!user.activePairId) {
    return { left: false, pairId: null };
  }

  const pair = await pairStore.getPairById(user.activePairId);
  await pairStore.leavePair(uid);

  return {
    left: true,
    pairId: user.activePairId,
    status: pair?.status || "pending",
  };
}

async function getMyPair(uid) {
  return pairStore.getPairForUser(uid);
}

module.exports = {
  ensureUserDoc,
  createPair,
  joinPair,
  getMyPair,
  leaveActivePair,
};
