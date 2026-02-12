// routes/v1/session.js

const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { ensureUserProfile } = require("../../services/pairs.supabase");

const router = express.Router();

/**
 * POST /v1/auth/session
 * Verifies Supabase access token and ensures profile exists.
 */
router.post("/session", requireAuth, async (req, res) => {
  try {
    const { uid, token } = req.auth;
    const user = await ensureUserProfile(uid, token);
    return res.json({ uid, user });
  } catch (err) {
    console.error("SESSION ERROR:", err);
    return res.status(500).json({ error: "session_failed" });
  }
});

module.exports = router;
