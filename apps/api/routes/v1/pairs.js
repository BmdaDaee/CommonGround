// routes/v1/pairs.js

const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { ensureUserProfile, createPair, joinPair, getMyPair, leaveActivePair } = require("../../services/pairs.supabase");

const router = express.Router();

router.use(requireAuth);

/**
 * POST /v1/pairs
 * Creates a new pair and returns { pairId, code }
 */
router.post("/", async (req, res) => {
  try {
    const { uid, token } = req.auth;
    await ensureUserProfile(uid, token);
    const result = await createPair(uid);
    return res.json(result);
  } catch (err) {
    console.error("CREATE PAIR ERROR:", err);
    if (err.message === "user_already_paired") return res.status(409).json({ error: "user_already_paired" });
    return res.status(500).json({ error: "create_pair_failed" });
  }
});

/**
 * POST /v1/pairs/join
 * body: { code }
 */
router.post("/join", async (req, res) => {
  try {
    const { uid, token } = req.auth;
    await ensureUserProfile(uid, token);
    const { code } = req.body || {};
    if (!code || typeof code !== "string") return res.status(400).json({ error: "missing_code" });
    const result = await joinPair(uid, code.trim().toUpperCase());
    return res.json(result);
  } catch (err) {
    console.error("JOIN PAIR ERROR:", err);
    const status = err.status || (err.message === "user_already_paired" ? 409 : 500);
    return res.status(status).json({ error: err.message || "join_pair_failed" });
  }
});

/**
 * GET /v1/pairs/me
 */
router.get("/me", async (req, res) => {
  try {
    const { uid, token } = req.auth;
    await ensureUserProfile(uid, token);
    const result = await getMyPair(uid);
    return res.json(result);
  } catch (err) {
    console.error("GET MY PAIR ERROR:", err);
    return res.status(500).json({ error: "get_pair_failed" });
  }
});

/**
 * POST /v1/pairs/leave
 * Leaves the caller's active pair.
 */
router.post("/leave", async (req, res) => {
  try {
    const { uid, token } = req.auth;
    await ensureUserProfile(uid, token);
    const result = await leaveActivePair(uid);
    return res.json(result);
  } catch (err) {
    console.error("LEAVE PAIR ERROR:", err);
    return res.status(err.status || 500).json({ error: err.message || "leave_pair_failed" });
  }
});

module.exports = router;
