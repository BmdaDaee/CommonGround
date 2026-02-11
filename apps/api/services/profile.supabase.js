const store = require("./devSupabaseStore");

async function getProfile(uid) {
  const user = store.getUser(uid);
  if (!user) {
    const err = new Error("profile_not_found");
    err.status = 404;
    throw err;
  }
  return { profile: user };
}

async function updateProfile(uid, patchInput = {}) {
  const existing = store.getUser(uid) || {
    uid,
    email: null,
    displayName: null,
    photoURL: null,
    activePairId: null,
    createdAt: store.nowIso(),
  };

  const patch = { ...existing, updatedAt: store.nowIso() };
  if (typeof patchInput.displayName === "string") patch.displayName = patchInput.displayName;
  if (typeof patchInput.photoURL === "string") patch.photoURL = patchInput.photoURL;

  store.setUser(uid, patch);
  return { profile: patch };
}

module.exports = { getProfile, updateProfile };
