// backend/repositories/relationshipRepository.memory.js
// In-memory relationship/pairing store for local dev.

const { randomUUID } = require("crypto");
const { createRelationshipDoc } = require("../models/relationship");

const relById = new Map();
const relByCode = new Map();

function makeInviteCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoids 0/1/I/O
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function touch(doc) {
  doc.updatedAt = new Date().toISOString();
  return doc;
}

async function createRelationship({ userId, displayName = null } = {}) {
  if (!userId) throw new Error("missing_userId");
  const relationshipId = "rel_" + randomUUID();
  let code = makeInviteCode();
  while (relByCode.has(code)) code = makeInviteCode();

  const doc = createRelationshipDoc(relationshipId, {
    partners: { userA: userId, userB: null, status: "PENDING" },
    system: { schemaVersion: 1, appVersion: "1.0.0" },
  });
  doc.inviteCode = code;
  doc.invite = { code, createdAt: new Date().toISOString(), redeemedAt: null };

  relById.set(relationshipId, doc);
  relByCode.set(code, relationshipId);
  return doc;
}

async function getRelationshipById(relationshipId) {
  return relById.get(relationshipId) || null;
}

async function getRelationshipByCode(code) {
  const id = relByCode.get(String(code || "").toUpperCase());
  if (!id) return null;
  return getRelationshipById(id);
}

async function joinRelationshipByCode({ code, userId } = {}) {
  if (!code) throw new Error("missing_code");
  if (!userId) throw new Error("missing_userId");

  const doc = await getRelationshipByCode(code);
  if (!doc) throw new Error("invalid_code");

  // Already in this relationship? Just return it.
  if (doc.partners?.userA == userId || doc.partners?.userB == userId) return doc;

  if (doc.partners?.userB) throw new Error("relationship_full");

  doc.partners.userB = userId;
  doc.partners.status = "ACTIVE";
  doc.partners.linkedAt = new Date().toISOString();
  doc.invite.redeemedAt = new Date().toISOString();

  relById.set(doc.id, touch(doc));
  return doc;
}

module.exports = {
  createRelationship,
  getRelationshipById,
  getRelationshipByCode,
  joinRelationshipByCode,
};
