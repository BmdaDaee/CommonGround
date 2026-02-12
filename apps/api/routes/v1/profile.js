// routes/v1/profile.js

const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { supabase } = require("../../lib/supabaseAdmin");

const router = express.Router();

router.use(requireAuth);

/**
 * GET /v1/profile
 */
router.get("/", async (req, res) => {
  try {
    const { uid } = req.auth;
    
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "profile_not_found" });
    }

    return res.json({ profile });
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

    const patch = {};
    if (typeof displayName === "string") patch.display_name = displayName;
    if (typeof photoURL === "string") patch.photo_url = photoURL;

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", uid)
      .select()
      .single();

    if (error) {
      console.error("PROFILE UPDATE ERROR:", error);
      return res.status(500).json({ error: "profile_update_failed" });
    }

    return res.json({ profile });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    return res.status(500).json({ error: "profile_update_failed" });
  }
});

module.exports = router;
