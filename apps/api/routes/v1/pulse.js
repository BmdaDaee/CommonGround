const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");

const router = express.Router();

const pulseByPair = new Map();

function nowIso() {
  return new Date().toISOString();
}

router.get("/pulse", requireAuth, async (req, res) => {
  const pairId = (req.query.pairId || "").trim();
  if (!pairId) return res.status(400).json({ error: "missing_pair_id" });

  const pulse = pulseByPair.get(pairId) || null;
  return res.json({ pulse });
});

router.post("/pulse", requireAuth, async (req, res) => {
  const pairId = (req.body?.pairId || "").trim();
  const mood = (req.body?.mood || "").trim();

  if (!pairId) return res.status(400).json({ error: "missing_pair_id" });
  if (!mood) return res.status(400).json({ error: "missing_mood" });

  const pulse = {
    pairId,
    mood,
    updatedAt: nowIso(),
    userId: req.user?.id || null,
  };

  pulseByPair.set(pairId, pulse);
  return res.json({ ok: true, pulse });
});

module.exports = router;
