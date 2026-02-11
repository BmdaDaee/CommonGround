// routes/v1/profile.js

const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { getProfile, updateProfile } = require("../../services/profile");

const router = express.Router();

router.use(requireAuth);

/**
 * GET /v1/profile
 */
router.get("/", async (req, res) => {
  try {
    const { uid } = req.auth;
    const result = await getProfile(uid);
    return res.json(result);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: "profile_not_found" });
    console.error("PROFILE READ ERROR:", err);
    return res.status(500).json({ error: "profile_read_failed" });
  }
});

/**
 * PUT /v1/profile
 * body: { displayName?, photoURL? }
 */
router.put("/", async (req, res) => {
  try {
    const { uid } = req.auth;
    const { displayName, photoURL } = req.body || {};

    const result = await updateProfile(uid, { displayName, photoURL });
    return res.json(result);
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    return res.status(500).json({ error: "profile_update_failed" });
  }
});

module.exports = router;
