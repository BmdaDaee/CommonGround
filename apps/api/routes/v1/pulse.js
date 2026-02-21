const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { supabase } = require("../../lib/supabaseAdmin");

const router = express.Router();

router.use(requireAuth);

// GET /v1/pulse?pairId=...
router.get("/", async (req, res) => {
  try {
    const pairId = (req.query.pairId || "").trim();
    if (!pairId) return res.status(400).json({ error: "missing_pair_id" });

    const { data, error } = await supabase
      .from("pulses")
      .select("pair_id, mood, updated_by, updated_at")
      .eq("pair_id", pairId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("PULSE GET ERROR:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.json({ pulse: null });
    }

    return res.json({
      pulse: {
        pairId: data.pair_id,
        mood: data.mood,
        updatedAt: data.updated_at,
        userId: data.updated_by,
      },
    });
  } catch (err) {
    console.error("PULSE GET ERROR:", err);
    return res.status(500).json({ error: "pulse_get_failed" });
  }
});

// POST /v1/pulse
router.post("/", async (req, res) => {
  try {
    const pairId = (req.body?.pairId || "").trim();
    const mood = (req.body?.mood || "").trim();

    if (!pairId) return res.status(400).json({ error: "missing_pair_id" });
    if (!mood) return res.status(400).json({ error: "missing_mood" });

    const { data, error } = await supabase
      .from("pulses")
      .upsert(
        {
          pair_id: pairId,
          mood,
          updated_by: req.auth?.uid || null,
        },
        { onConflict: "pair_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("PULSE UPSERT ERROR:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      ok: true,
      pulse: {
        pairId: data.pair_id,
        mood: data.mood,
        updatedAt: data.updated_at,
        userId: data.updated_by,
      },
    });
  } catch (err) {
    console.error("PULSE POST ERROR:", err);
    return res.status(500).json({ error: "pulse_post_failed" });
  }
});

module.exports = router;