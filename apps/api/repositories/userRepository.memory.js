// backend/repositories/userRepository.memory.js
// Simple in-memory user store for local dev.

const { createUserDoc } = require("../models/user");

const usersById = new Map();

async function getUserById(userId) {
  return usersById.get(userId) || null;
}

async function createUser(userId, { displayName = null } = {}) {
  const doc = createUserDoc(userId, {
    profile: { displayName },
  });
  usersById.set(userId, doc);
  return doc;
}

async function upsertUser(userId, { displayName = null } = {}) {
  let doc = usersById.get(userId);
  if (!doc) return createUser(userId, { displayName });

  if (displayName !== null) doc.profile.displayName = displayName;
  doc.updatedAt = new Date().toISOString();
  usersById.set(userId, doc);
  return doc;
}

module.exports = {
  getUserById,
  createUser,
  upsertUser,
};
