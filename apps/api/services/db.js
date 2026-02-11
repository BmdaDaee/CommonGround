// services/db.js

const { db } = require("../config/firebaseAdmin");
const { assertFirestoreAvailable } = require("../config/firestoreLock");
const { createUserDoc } = require("../models/user");
const { createRelationshipDoc } = require("../models/relationship");
const { createSessionDoc } = require("../models/session");

/**
 * Create or update a user in Firestore.
 */
async function upsertUser(userId, overrides = {}) {
  assertFirestoreAvailable("services.db.upsertUser");
  const userDoc = createUserDoc(userId, overrides);
  const ref = db.collection("users").doc(userId);

  await ref.set(userDoc, { merge: true });

  return userDoc;
}

/**
 * Get a user by id from Firestore.
 */
async function getUser(userId) {
  assertFirestoreAvailable("services.db.getUser");
  const snap = await db.collection("users").doc(userId).get();
  if (!snap.exists) return null;
  return snap.data();
}

/**
 * Create or update a relationship.
 */
async function upsertRelationship(relId, overrides = {}) {
  assertFirestoreAvailable("services.db.upsertRelationship");
  const relDoc = createRelationshipDoc(relId, overrides);
  const ref = db.collection("relationships").doc(relId);

  await ref.set(relDoc, { merge: true });

  return relDoc;
}

/**
 * Get a relationship by id.
 */
async function getRelationship(relId) {
  assertFirestoreAvailable("services.db.getRelationship");
  const snap = await db.collection("relationships").doc(relId).get();
  if (!snap.exists) return null;
  return snap.data();
}

/**
 * Create a new session (one per coaching session).
 */
async function createSession(sessionId, overrides = {}) {
  assertFirestoreAvailable("services.db.createSession");
  const sessDoc = createSessionDoc(sessionId, overrides);
  const ref = db.collection("sessions").doc(sessionId);

  await ref.set(sessDoc);

  return sessDoc;
}

/**
 * Get a session doc by id.
 */
async function getSession(sessionId) {
  assertFirestoreAvailable("services.db.getSession");
  const snap = await db.collection("sessions").doc(sessionId).get();
  if (!snap.exists) return null;
  return snap.data();
}

module.exports = {
  upsertUser,
  getUser,
  upsertRelationship,
  getRelationship,
  createSession,
  getSession,
};
