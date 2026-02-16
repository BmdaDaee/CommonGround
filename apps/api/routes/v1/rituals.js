const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../middleware/requireAuth");
const { supabaseAdmin } = require("../../lib/supabaseAdmin");

router.use(requireAuth);

/**
 * POST /v1/rituals/complete
 * body: { pairId: string, ritualKey?: string }
 */
router.post("/complete", async (req, res) => {
  try {
    const { pairId, ritualKey = "daily" } = req.body || {};
    if (!pairId) return res.status(400).json({ error: "pairId is required" });

    const { uid } = req.auth || {};
    if (!uid) return res.status(401).json({ error: "Not authenticated" });

    const day = new Date().toISOString().slice(0, 10);

    const { error } = await supabaseAdmin
      .from("pair_rituals")
      .upsert(
        { pair_id: pairId, user_id: uid, ritual_key: ritualKey, completed: true, day },
        { onConflict: "pair_id,ritual_key,day" }
      );

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
});

module.exports = router;
