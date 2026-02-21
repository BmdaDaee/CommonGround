const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { supabase } = require("../../lib/supabaseAdmin");

const router = express.Router();

router.use(requireAuth);

// GET /v1/pulse?pairId=...
router.get("/", async (req, res) => {
  try {
    const pairId = String(req.query.pairId || "").trim();
    if (!pairId) return res.status(400).json({ error: "missing_pair_id" });

    const { data, error } = await supabase
      .from("pulses")
      .select("pair_id, user_id, mood, updated_at")
      .eq("pair_id", pairId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("PULSE GET ERROR:", error);
      return res.status(500).json({ error: error.message || "pulse_get_failed" });
    }

    const pulses = (data || []).map((row) => ({
      userId: row.user_id,
      mood: row.mood,
      updatedAt: row.updated_at,
    }));

    return res.json({ pairId, pulses });
  } catch (err) {
    console.error("PULSE GET ERROR:", err);
    return res.status(500).json({ error: "pulse_get_failed" });
  }
});

// POST /v1/pulse
// body: { pairId, mood }
router.post("/", async (req, res) => {
  try {
    const pairId = String(req.body?.pairId || "").trim();
    const mood = String(req.body?.mood || "").trim();
    const userId = req.auth?.uid || null;

    if (!pairId) return res.status(400).json({ error: "missing_pair_id" });
    if (!mood) return res.status(400).json({ error: "missing_mood" });
    if (!userId) return res.status(401).json({ error: "missing_user" });

    const { data, error } = await supabase
      .from("pulses")
      .upsert(
        { pair_id: pairId, user_id: userId, mood },
        { onConflict: "pair_id,user_id" }
      )
      .select("pair_id, user_id, mood, updated_at")
      .single();

    if (error) {
      console.error("PULSE UPSERT ERROR:", error);
      return res.status(500).json({ error: error.message || "pulse_post_failed" });
    }

    return res.json({
      ok: true,
      pulse: {
        pairId: data.pair_id,
        userId: data.user_id,
        mood: data.mood,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    console.error("PULSE POST ERROR:", err);
    return res.status(500).json({ error: "pulse_post_failed" });
  }
});

module.exports = router;
