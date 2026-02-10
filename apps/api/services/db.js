// services/db.js

const { getFirestoreDb } = require("../config/firestore");
const { createUserDoc } = require("../models/user");
const { createRelationshipDoc } = require("../models/relationship");
const { createSessionDoc } = require("../models/session");

/**
 * Create or update a user in Firestore.
 */
async function upsertUser(userId, overrides = {}) {
  const db = getFirestoreDb();
  const userDoc = createUserDoc(userId, overrides);
  const ref = db.collection("users").doc(userId);

  await ref.set(userDoc, { merge: true });

  return userDoc;
}

/**
 * Get a user by id from Firestore.
 */
async function getUser(userId) {
  const db = getFirestoreDb();
  const snap = await db.collection("users").doc(userId).get();
  if (!snap.exists) return null;
  return snap.data();
}

/**
 * Create or update a relationship.
 */
async function upsertRelationship(relId, overrides = {}) {
  const db = getFirestoreDb();
  const relDoc = createRelationshipDoc(relId, overrides);
  const ref = db.collection("relationships").doc(relId);

  await ref.set(relDoc, { merge: true });

  return relDoc;
}

/**
 * Get a relationship by id.
 */
async function getRelationship(relId) {
  const db = getFirestoreDb();
  const snap = await db.collection("relationships").doc(relId).get();
  if (!snap.exists) return null;
  return snap.data();
}

/**
 * Create a new session (one per coaching session).
 */
async function createSession(sessionId, overrides = {}) {
  const db = getFirestoreDb();
  const sessDoc = createSessionDoc(sessionId, overrides);
  const ref = db.collection("sessions").doc(sessionId);

  await ref.set(sessDoc);

  return sessDoc;
}

/**
 * Get a session doc by id.
 */
async function getSession(sessionId) {
  const db = getFirestoreDb();
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
