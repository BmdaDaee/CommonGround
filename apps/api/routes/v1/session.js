// routes/v1/session.js
const express = require("express");
const router = express.Router();

const requireAuthMod = require("../../middleware/requireAuth");
const requireAuth = requireAuthMod.requireAuth || requireAuthMod;

const { db } = require("../../config/firebaseAdmin");

function normalizeNonEmptyString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getMembersCount(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

router.post("/session", requireAuth, async (req, res) => {
  try {
    const uid = req.auth?.uid || req.user?.uid || null;
    if (!uid) {
      return res.status(401).json({ error: "invalid_auth_context" });
    }

    let userDoc = req.userDoc || null;
    if (!userDoc) {
      const snap = await db.collection("users").doc(uid).get();
      userDoc = snap.exists ? snap.data() : null;
    }

    const activePairId =
      normalizeNonEmptyString(userDoc?.activePairId) ||
      normalizeNonEmptyString(userDoc?.pairId) ||
      normalizeNonEmptyString(userDoc?.pair?.id) ||
      null;
    const pairRole = userDoc?.pairRole ?? null;

    let pair = null;
    if (activePairId) {
      const pairSnap = await db.collection("pairs").doc(activePairId).get();
      if (pairSnap.exists) {
        const p = pairSnap.data() || {};
        pair = {
          id: pairSnap.id,
          status: p.status || "pending",
          membersCount: getMembersCount(p.members),
          code: p.code || null,
        };
      }
    }

    return res.json({
      uid,
      user: {
        ...(userDoc || {}),
        activePairId,
        pairRole,
      },
      pair,
    });
  } catch {
    return res.status(500).json({ error: "session_failed" });
  }
});

module.exports = router;
