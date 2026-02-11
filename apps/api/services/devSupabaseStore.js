const state = {
  users: new Map(),
  pairs: new Map(),
  pairByCode: new Map(),
  messagesByPair: new Map(),
};

function nowIso() {
  return new Date().toISOString();
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getUser(uid) {
  return state.users.get(uid) || null;
}

function setUser(uid, value) {
  state.users.set(uid, clone(value));
  return state.users.get(uid);
}

function getPair(pairId) {
  return state.pairs.get(pairId) || null;
}

function setPair(pairId, value) {
  state.pairs.set(pairId, clone(value));
  if (value.code) state.pairByCode.set(value.code, pairId);
  return state.pairs.get(pairId);
}

function getPairByCode(code) {
  const pairId = state.pairByCode.get(code);
  return pairId ? getPair(pairId) : null;
}

function getMessages(pairId) {
  return (state.messagesByPair.get(pairId) || []).map(clone);
}

function upsertMessage(pairId, message) {
  const list = state.messagesByPair.get(pairId) || [];
  const idx = list.findIndex((m) => m.id === message.id);
  if (idx >= 0) {
    list[idx] = clone(message);
  } else {
    list.push(clone(message));
  }
  state.messagesByPair.set(pairId, list);
}

function resetStore() {
  state.users.clear();
  state.pairs.clear();
  state.pairByCode.clear();
  state.messagesByPair.clear();
}

module.exports = {
  nowIso,
  getUser,
  setUser,
  getPair,
  setPair,
  getPairByCode,
  getMessages,
  upsertMessage,
  resetStore,
};
