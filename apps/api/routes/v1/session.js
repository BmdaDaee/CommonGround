// routes/v1/session.js

const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { ensureUserDoc } = require("../../services/pairs");

const router = express.Router();

/**
 * POST /v1/auth/session
 * Verifies Firebase ID token (via middleware) and ensures user doc exists.
 */
router.post("/session", requireAuth, async (req, res) => {
  try {
    const { uid, token } = req.auth;
    const user = await ensureUserDoc(uid, token);
    return res.json({ uid, user });
  } catch (err) {
    console.error("SESSION ERROR:", err);
    return res.status(500).json({ error: "session_failed" });
  }
});

module.exports = router;
