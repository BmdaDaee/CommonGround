// routes/v1/pair.js

const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { ensureUserDoc, createPair, joinPair } = require("../../services/pairs");

const router = express.Router();

router.use(requireAuth);

/**
 * POST /v1/pair/create
 * Creates a new pair and returns { pairId, code }
 */
router.post("/create", async (req, res) => {
  try {
    const { uid, token } = req.auth;
    await ensureUserDoc(uid, token);
    const result = await createPair(uid);
    return res.json(result);
  } catch (err) {
    console.error("CREATE PAIR ERROR:", err);
    if (err.message === "user_already_paired") return res.status(409).json({ error: "user_already_paired" });
    return res.status(500).json({ error: "create_pair_failed" });
  }
});

/**
 * POST /v1/pair/join
 * body: { code }
 */
router.post("/join", async (req, res) => {
  try {
    const { uid, token } = req.auth;
    await ensureUserDoc(uid, token);
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

module.exports = router;
