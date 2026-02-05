// backend/services/taskPrompts.js

const { getSystemPrompt } = require("../persona/engine");

/**
 * Task prompt builders.
 * Keep these content-focused (what to do), and let persona/system prompt control voice.
 */

const JSON_ONLY = "Return ONLY valid JSON. No markdown. No commentary.";

function normalizeTask(task) {
  return String(task || "").trim().toLowerCase();
}

function buildDraftReply({ context }) {
  const c = String(context || "").trim();
  return `
TASK: Draft Reply

Goal: Write a single message the user can send right now.

Rules:
- No manipulation. No threats. No humiliating language.
- Keep it short. Max 4 sentences.
- If you need a question, ask ONE.

Context:
${c || "(no context provided)"}

Output:
Give the message only.
`.trim();
}

function buildSpark({ context }) {
  const c = String(context || "").trim();
  return `
TASK: Spark

Goal: Give 3 conversation starters that feel natural and fun.
Rules:
- Each starter should be 1–2 sentences.
- Avoid therapy language.
- Keep it specific to the context.

Context:
${c || "(no context provided)"}

Output:
Numbered list 1–3.
`.trim();
}

function buildNote({ context }) {
  const c = String(context || "").trim();
  return `
TASK: Note

Goal: Turn this into a clean, short note the user can save.
Rules:
- 5–8 bullet points max.
- Capture facts + feelings + next step.

Raw:
${c || "(no text provided)"}

Output:
Bullet list only.
`.trim();
}

function buildVentAnalysis({ context }) {
  const c = String(context || "").trim();
  return `
TASK: Vent Analysis

Goal: Break down what’s happening without diagnosing anyone.

${JSON_ONLY}

JSON schema:
{
  "headline": string,
  "what_hurt": [string],
  "what_you_need": [string],
  "likely_trigger_phrases": [string],
  "repair_attempt": string,
  "two_scripts": { "soft": string, "realtalk": string }
}

Text to analyze:
${c || "(no text provided)"}
`.trim();
}

function buildDatePlan({ context }) {
  const c = String(context || "").trim();
  return `
TASK: Date Plan

Goal: Plan a date that helps the couple reconnect.

${JSON_ONLY}

JSON schema:
{
  "theme": string,
  "budget_tier": "free" | "low" | "mid" | "splurge",
  "plan": [ { "step": string, "time": string } ],
  "one_text_invite": string,
  "one_boundary": string
}

Preferences / context:
${c || "(no context provided)"}
`.trim();
}

const TASK_BUILDERS = {
  draft_reply: buildDraftReply,
  spark: buildSpark,
  note: buildNote,
  vent_analysis: buildVentAnalysis,
  date_plan: buildDatePlan,
};

function buildTaskPrompt({ task, context, vibe, calloutShown = false } = {}) {
  const t = normalizeTask(task);
  const builder = TASK_BUILDERS[t];
  if (!builder) {
    return {
      system: getSystemPrompt({ calloutShown, vibe }),
      prompt: `TASK: Unknown (${t || "(missing)"})\n\nContext:\n${String(context || "")}`.trim(),
      expectsJson: false,
    };
  }

  const prompt = builder({ context });
  const expectsJson = t === "vent_analysis" || t === "date_plan";
  return {
    system: getSystemPrompt({ calloutShown, vibe }),
    prompt,
    expectsJson,
  };
}

module.exports = { buildTaskPrompt, normalizeTask };
