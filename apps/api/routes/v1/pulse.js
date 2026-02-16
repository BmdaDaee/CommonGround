const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../middleware/requireAuth");
const { supabaseAdmin } = require("../../lib/supabaseAdmin");

router.use(requireAuth);

/**
 * POST /v1/pulse
 * body: { pairId: string, mood: string }
 */
router.post("/", async (req, res) => {
  try {
    const { pairId, mood } = req.body || {};
    if (!pairId || !mood) return res.status(400).json({ error: "pairId and mood are required" });

    const { uid, token } = req.auth || {};
    if (!uid) return res.status(401).json({ error: "Not authenticated" });

    const day = new Date().toISOString().slice(0, 10);

    const { error } = await supabaseAdmin
      .from("pair_pulses")
      .upsert({ pair_id: pairId, user_id: uid, mood, day }, { onConflict: "pair_id,user_id,day" });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
});

module.exports = router;
