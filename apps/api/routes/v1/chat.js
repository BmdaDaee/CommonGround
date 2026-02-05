// routes/v1/chat.js

const express = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const { sendMessage, listMessages } = require("../../services/chat");

const router = express.Router();

router.use(requireAuth);

/**
 * POST /v1/chat/:pairId/send
 * body: { messageId, clientId?, text }
 */
router.post("/:pairId/send", async (req, res) => {
  try {
    const { uid } = req.auth;
    const { pairId } = req.params;
    const { messageId, clientId, text } = req.body || {};

    if (!messageId || typeof messageId !== "string") return res.status(400).json({ error: "missing_messageId" });
    if (!text || typeof text !== "string") return res.status(400).json({ error: "missing_text" });

    const message = await sendMessage({
      pairId,
      messageId,
      clientId: clientId || null,
      senderId: uid,
      text,
    });

    return res.json({ message });
  } catch (err) {
    console.error("CHAT SEND ERROR:", err);
    return res.status(err.status || 500).json({ error: err.message || "send_failed" });
  }
});

/**
 * GET /v1/chat/:pairId/list?limit=30&before=<millis>
 */
router.get("/:pairId/list", async (req, res) => {
  try {
    const { uid } = req.auth;
    const { pairId } = req.params;
    const { limit, before } = req.query || {};

    const result = await listMessages({ pairId, uid, limit, before });
    return res.json(result);
  } catch (err) {
    console.error("CHAT LIST ERROR:", err);
    return res.status(err.status || 500).json({ error: err.message || "list_failed" });
  }
});

module.exports = router;
