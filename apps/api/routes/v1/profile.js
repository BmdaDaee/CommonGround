// routes/v1/profile.js

const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { db } = require("../../config/firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

const router = express.Router();

router.use(requireAuth);

/**
 * GET /v1/profile
 */
router.get("/", async (req, res) => {
  try {
    const { uid } = req.auth;
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ error: "profile_not_found" });
    return res.json({ profile: snap.data() });
  } catch (err) {
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

    const patch = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (typeof displayName === "string") patch.displayName = displayName;
    if (typeof photoURL === "string") patch.photoURL = photoURL;

    await db.collection("users").doc(uid).set(patch, { merge: true });
    const snap = await db.collection("users").doc(uid).get();
    return res.json({ profile: snap.data() });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    return res.status(500).json({ error: "profile_update_failed" });
  }
});

module.exports = router;
