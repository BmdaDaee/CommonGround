// backend/server.js
require("dotenv").config();
const { validateApiEnv } = require("./config/env");

validateApiEnv();

const express = require("express");
const cors = require("cors");

// Phase 1 foundation API (auth/pair/profile/chat)
const v1Routes = require("./routes/v1");

const {
  getOrCreateSession,
  updateSession,
  updateSessionFields,
  getSessionById,
} = require("./services/session");

const { buildPrompt } = require("./persona/engine");
const { generateResponse, generateResponseStream } = require("./services/ai");
const { getPatternState } = require("./services/patternTracker");
const { runTask } = require("./services/aiTasks");

// Optional: keep your voice endpoints if services/voice.js exists
let textToSpeech, listVoicePacks;
try {
  ({ textToSpeech, listVoicePacks } = require("./services/voice"));
} catch {
  // voice is optional
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const { apiRateLimit } = require("./middleware/rateLimit");
app.use(apiRateLimit);

// Versioned API
app.use("/v1", v1Routes);

const PORT = process.env.PORT || 3001;

function badRequest(res, msg) {
  return res.status(400).json({ error: msg });
}

function isMetaMessage(message) {
  return ["__SUMMARY__", "__PATTERN__", "__REFLECT__"].includes(message);
}

app.get("/health", (req, res) => {
  res.json({ ok: true, port: PORT });
});

/**
 * Read full session (server-authoritative)
 * GET /session/:id
 */
app.get("/session/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await getSessionById(sessionId);

    if (!session) return res.status(404).json({ error: "session_not_found" });

    res.json({
      id: session.id,
      userId: session.userId,
      mode: session.mode,
      toneState: session.toneState,
      patternTracker: session.patternTracker || {
        counts: {},
        lastFired: null,
        firedTopics: {},
      },
      history: Array.isArray(session.history) ? session.history : [],
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    console.error("SESSION READ ERROR:", err);
    res.status(500).json({ error: "session_read_failed" });
  }
});

/**
 * Debug: inspect persona pattern tracker by sessionId
 * GET /debug/session/:id/patterns
 */
app.get("/debug/session/:id/patterns", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await getSessionById(sessionId);

    if (!session) return res.status(404).json({ error: "session_not_found" });

    res.json({
      sessionId: session.id,
      userId: session.userId,
      mode: session.mode,
      toneState: session.toneState,
      patternTracker: session.patternTracker || {
        counts: {},
        lastFired: null,
        firedTopics: {},
      },
    });
  } catch (err) {
    console.error("PATTERN DEBUG ERROR:", err);
    res.status(500).json({ error: "pattern_debug_failed" });
  }
});

/**
 * Debug: inspect analytics pattern tracker by userId
 * GET /debug/user/:userId/patterns
 */
app.get("/debug/user/:userId/patterns", async (req, res) => {
  try {
    const userId = req.params.userId;
    const state = await getPatternState(userId);
    res.json(state);
  } catch (err) {
    console.error("USER PATTERN DEBUG ERROR:", err);
    res.status(500).json({ error: "user_pattern_debug_failed" });
  }
});

/**
 * Voice packs (optional, only if voice service exists)
 */
if (typeof listVoicePacks === "function") {
  app.get("/voice-packs", (req, res) => {
    res.json({ voicePacks: listVoicePacks() });
  });
}

/**
 * OPTION A CONTRACT:
 * POST /chat
 * body: { userId: string, message: string }
 */
app.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body || {};

    if (!userId || typeof userId !== "string") return badRequest(res, "Missing 'userId' (string)");
    if (!message || typeof message !== "string") return badRequest(res, "Missing 'message' (string)");

    const session = await getOrCreateSession(userId);
    session.history = Array.isArray(session.history) ? session.history : [];

    const { prompt, toneState, meta } = await buildPrompt(message, session);

    const reply = await generateResponse(prompt);

    if (!isMetaMessage(message)) await updateSession(session.id, "user", message);
    await updateSession(session.id, "assistant", reply);

    await updateSessionFields(session.id, {
      toneState,
      mode: session.mode,
      patternTracker: session.patternTracker,
    });

    res.json({
      reply,
      toneState,
      sessionId: session.id,
      meta: meta || {},
    });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({ error: "chat_failed" });
  }
});

/**
 * OPTION A CONTRACT:
 * POST /chat-stream
 * body: { userId: string, message: string }
 *
 * SSE events:
 * - token: { token }
 * - done:  { reply, toneState, sessionId, meta }
 * - error: { error }
 */
app.post("/chat-stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let clientClosed = false;
  req.on("close", () => {
    clientClosed = true;
  });

  try {
    const { userId, message } = req.body || {};

    if (!userId || typeof userId !== "string") {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "missing_userId" })}\n\n`);
      return res.end();
    }
    if (!message || typeof message !== "string") {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "missing_message" })}\n\n`);
      return res.end();
    }

    const session = await getOrCreateSession(userId);
    session.history = Array.isArray(session.history) ? session.history : [];

    const { prompt, toneState, meta } = await buildPrompt(message, session);

    let reply = "";

    await generateResponseStream(prompt, (token) => {
      if (clientClosed) return;
      reply += token;
      res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
    });

    if (!isMetaMessage(message)) await updateSession(session.id, "user", message);
    await updateSession(session.id, "assistant", reply);

    await updateSessionFields(session.id, {
      toneState,
      mode: session.mode,
      patternTracker: session.patternTracker,
    });

    if (!clientClosed) {
      res.write(
        `event: done\ndata: ${JSON.stringify({
          reply,
          toneState,
          sessionId: session.id,
          meta: meta || {},
        })}\n\n`
      );
    }

    res.end();
  } catch (err) {
    console.error("STREAM ERROR:", err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: "stream_failed" })}\n\n`);
    res.end();
  }
});

/**
 * Task-style AI features (prototype "bells & whistles")
 * POST /ai
 * body: { userId: string, task: string, context: string, vibe?: "soft"|"realtalk"|"savage" }
 */
app.post("/ai", async (req, res) => {
  try {
    const { userId, task, context, vibe } = req.body || {};

    if (!userId || typeof userId !== "string") return badRequest(res, "Missing 'userId' (string)");
    if (!task || typeof task !== "string") return badRequest(res, "Missing 'task' (string)");
    // context can be empty, but normalize to string

    const out = await runTask({ userId, task, context: String(context || ""), vibe });
    res.json({
      ok: true,
      task,
      output: out.output,
      parsed: out.parsed,
      parseError: out.parseError || null,
      expectsJson: out.expectsJson,
      sessionId: out.sessionId,
    });
  } catch (err) {
    console.error("AI TASK ERROR:", err);
    res.status(500).json({ ok: false, error: "ai_task_failed" });
  }
});

/**
 * TTS (optional, only if voice service exists)
 */
if (typeof textToSpeech === "function") {
  app.post("/speak", async (req, res) => {
    try {
      const { text, voicePackId, toneMode, delivery, voice, model } = req.body || {};
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Missing 'text' field" });
      }

      const out = await textToSpeech(text, { voicePackId, toneMode, delivery, voice, model });

      res.json({
        audio: out.audioBase64,
        format: out.format,
        voice: out.voice,
        model: out.model,
        voicePack: out.voicePack,
        instructions: out.instructions,
      });
    } catch (err) {
      console.error("TTS ERROR:", err);
      if (err.code === "VOICE_PACK_LOCKED") {
        return res.status(403).json({ error: err.message, code: err.code });
      }
      res.status(500).json({ error: "tts_failed" });
    }
  });
}

app.listen(PORT, () => {
  console.log(`[API] listening on http://localhost:${PORT}`);
  console.log(`[AI] OPENAI_API_KEY present: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`[SESSIONS] store: ${process.env.SESSION_STORE || "memory"}`);
});
