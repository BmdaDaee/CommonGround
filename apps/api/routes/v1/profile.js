// routes/v1/profile.js

const crypto = require("crypto");
const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { getFirestoreDb } = require("../../config/firestore");

const router = express.Router();

router.use(requireAuth);

function normalizeNonEmptyString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isDevSupabaseLock() {
  const isProduction = (process.env.NODE_ENV || "").toLowerCase() === "production";
  const lock = typeof process.env.DEV_BACKEND_LOCK === "string"
    ? process.env.DEV_BACKEND_LOCK.trim().toLowerCase()
    : "";

  return !isProduction && lock === "supabase";
}

function buildDeterministicDevProfile(uid, overrides = {}) {
  const resolvedUid = normalizeNonEmptyString(uid) || "dev_user";
  const hash = crypto.createHash("sha256").update(resolvedUid).digest("hex");

  const fallbackDisplayName = `Dev User ${hash.slice(0, 6).toUpperCase()}`;
  const fallbackPhotoURL = `https://example.com/dev-avatar/${hash.slice(0, 16)}.png`;

  const displayName = normalizeNonEmptyString(overrides.displayName) || fallbackDisplayName;
  const photoURL = normalizeNonEmptyString(overrides.photoURL) || fallbackPhotoURL;

  return {
    uid: resolvedUid,
    displayName,
    photoURL,
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}

/**
 * GET /v1/profile
 */
router.get("/", async (req, res) => {
  try {
    const { uid } = req.auth;

    if (isDevSupabaseLock()) {
      return res.json({ profile: buildDeterministicDevProfile(uid) });
    }

    const db = getFirestoreDb();
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ error: "profile_not_found" });
    return res.json({ profile: snap.data() });
  } catch (err) {
    console.error("PROFILE READ ERROR:", err);
    if (typeof err?.message === "string" && err.message.includes("[firestore-lock]")) {
      return res.status(500).json({ error: err.message });
    }
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

    if (isDevSupabaseLock()) {
      return res.json({
        profile: buildDeterministicDevProfile(uid, { displayName, photoURL }),
      });
    }

    const db = getFirestoreDb();
    const { FieldValue } = require("firebase-admin/firestore");

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
    if (typeof err?.message === "string" && err.message.includes("[firestore-lock]")) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "profile_update_failed" });
  }
});

router._test = {
  isDevSupabaseLock,
  buildDeterministicDevProfile,
};

module.exports = router;
