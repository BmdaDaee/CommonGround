const { db } = require("../config/firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

async function getProfile(uid) {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) {
    const err = new Error("profile_not_found");
    err.status = 404;
    throw err;
  }
  return { profile: snap.data() };
}

async function updateProfile(uid, patchInput = {}) {
  const patch = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (typeof patchInput.displayName === "string") patch.displayName = patchInput.displayName;
  if (typeof patchInput.photoURL === "string") patch.photoURL = patchInput.photoURL;

  await db.collection("users").doc(uid).set(patch, { merge: true });
  const snap = await db.collection("users").doc(uid).get();
  return { profile: snap.data() };
}

module.exports = { getProfile, updateProfile };
