// backend/services/aiTasks.js

const { getOrCreateSession, updateSessionFields } = require("./session");
const { buildTaskPrompt } = require("./taskPrompts");
const { generateResponse } = require("./ai");

function safeJsonParse(text) {
  if (typeof text !== "string") return { ok: false, error: "not_a_string", value: null };

  // Try direct parse first
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {}

  // Try to recover the first JSON object block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return { ok: false, error: "no_json_object", value: null };
  }

  const slice = text.slice(start, end + 1);
  try {
    return { ok: true, value: JSON.parse(slice) };
  } catch (err) {
    return { ok: false, error: "json_parse_failed", value: null };
  }
}

async function runTask({ userId, task, context, vibe }) {
  if (!userId || typeof userId !== "string") throw new Error("missing_userId");

  const session = await getOrCreateSession(userId);
  session.vibe = vibe || session.vibe || "realtalk";

  const { system, prompt, expectsJson } = buildTaskPrompt({ task, context, vibe: session.vibe });

  const fullPrompt = `${system}\n\n${prompt}`.trim();
  const outputText = await generateResponse(fullPrompt);

  // Persist vibe to session so chat uses it too
  await updateSessionFields(session.id, { vibe: session.vibe });

  if (!expectsJson) {
    return { output: outputText, parsed: null, expectsJson: false, sessionId: session.id };
  }

  const parsed = safeJsonParse(outputText);
  return {
    output: outputText,
    parsed: parsed.ok ? parsed.value : null,
    parseError: parsed.ok ? null : parsed.error,
    expectsJson: true,
    sessionId: session.id,
  };
}

module.exports = { runTask };
