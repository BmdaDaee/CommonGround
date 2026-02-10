// routes/v1/session.js
const express = require("express");
const router = express.Router();

const requireAuthMod = require("../../middleware/requireAuth");
const requireAuth = requireAuthMod.requireAuth || requireAuthMod;
const { ensureUserDoc, getMyPair } = require("../../services/pairs");

function normalizeNonEmptyString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getMembersCount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

function normalizePairRole(value) {
  return value === "a" || value === "b" ? value : null;
}

router.post("/session", requireAuth, async (req, res) => {
  try {
    const uid = req.auth?.uid || req.user?.uid || null;
    if (!uid) {
      return res.status(401).json({ error: "invalid_auth_context" });
    }

    const userDoc = await ensureUserDoc(uid, req.auth?.token || null);

    const activePairId =
      normalizeNonEmptyString(userDoc?.activePairId) ||
      normalizeNonEmptyString(userDoc?.pairId) ||
      normalizeNonEmptyString(userDoc?.pair?.id) ||
      null;
    const pairRole = normalizePairRole(userDoc?.pairRole);

    let pair = null;
    if (activePairId) {
      const pairResult = await getMyPair(uid);
      const p = pairResult?.pair || null;
      if (p && normalizeNonEmptyString(p.id) === activePairId) {
        pair = {
          id: p.id,
          status: p.status || "pending",
          membersCount: getMembersCount(p.membersCount ?? p.members),
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
