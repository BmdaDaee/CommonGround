const express = require("express");
const crypto = require("crypto");
const router = express.Router();

function getSafeMode(req) {
  const m = (req.query?.mode ?? req.body?.mode);
  return m === "deep" ? "deep" : "common";
}


const { requireAuth } = require("../../middleware/requireAuth");
const { supabase } = require("../../lib/supabaseAdmin");

router.use(requireAuth);

router.post("/:pairId/send", async (req, res) => {
  try {
    const pairId = req.params.pairId;
    const safeMode = (req.query?.mode === 'deep' ? 'deep' : 'common');
    const { messageId, text } = req.body || {};

    const trimmed = String(text || "").trim();
    if (!pairId) return res.status(400).json({ error: "missing_pair_id" });
    if (!trimmed) return res.status(400).json({ error: "missing_text" });

    const serverId = crypto.randomUUID();
    const clientId = String(messageId || serverId);

    const payload = {
      id: serverId,
      client_id: clientId,
      pair_id: pairId,
      sender_id: req.auth.uid,
      text: trimmed,
      server_created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("messages")
      .insert(payload)
      .select("id, client_id, text, sender_id, server_created_at, created_at")
      .single();

    if (error) {
      console.error("CHAT SEND ERROR:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      message: {
        id: data.id,
        clientId: data.client_id || null,
        text: data.text,
        authorUid: data.sender_id,
        createdAt: new Date(data.server_created_at || data.created_at).getTime(),
      },
    });
  } catch (err) {
    console.error("CHAT SEND ERROR:", err);
    return res.status(500).json({ error: "send_failed" });
  }
});

router.get("/:pairId/list", async (req, res) => {
    const safeMode = getSafeMode(req);

  try {
    const pairId = req.params.pairId;
    const limit = Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 200);

    if (!pairId) return res.status(400).json({ error: "missing_pair_id" });

    const { data, error } = await supabase
      .from("messages")
      .select("id, client_id, text, sender_id, server_created_at, created_at")
      .eq("pair_id", pairId)
      .eq("mode", safeMode)
      .order("server_created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("CHAT LIST ERROR:", error);
      return res.status(500).json({ error: error.message });
    }

    const messages = (data || []).map((m) => ({
      id: m.id,
      clientId: m.client_id || null,
      text: m.text,
      authorUid: m.sender_id,
      createdAt: new Date(m.server_created_at || m.created_at).getTime(),
    }));

    return res.json({ messages, nextBefore: null });
  } catch (err) {
    console.error("CHAT LIST ERROR:", err);
    return res.status(500).json({ error: "list_failed" });
  }
});

module.exports = router;
