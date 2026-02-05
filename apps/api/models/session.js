// models/session.js

/**
 * Create a new session document with default fields.
 *
 * This represents a single "coaching session" between:
 *  - one user (solo), or
 *  - a couple (linked via relationshipId)
 *
 * sessionId: string (e.g. "sess_abc123")
 * overrides: optional nested object to override defaults
 */

function createSessionDoc(sessionId, overrides = {}) {
  const now = new Date().toISOString();

  const base = {
    id: sessionId,
    createdAt: now,
    updatedAt: now,

    context: {
      type: "COUPLE",          // COUPLE | SOLO
      relationshipId: null,    // required if COUPLE
      userId: null,            // required if SOLO
      startedBy: null,         // user id that initiated session
      participants: [],        // array of user ids
    },

    focus: {
      topic: "GENERAL",        // GENERAL | CONFLICT | INTIMACY | CHECKIN | GOAL_SETTING
      description: null,       // free-text description of what they said at start
      contentLevelCap: "SUGGESTIVE", // SAFE | SUGGESTIVE; EXPLICIT handled by other engine
    },

    status: {
      state: "OPEN",           // OPEN | PAUSED | CLOSED
      closedAt: null,
    },

    transcript: [
      // Example entry:
      // {
      //   id: "msg_1",
      //   timestamp: "2025-12-10T10:00:00.000Z",
      //   senderType: "user",      // user | partner | ai
      //   senderId: "user_123",    // null for ai
      //   role: "USER",            // USER | PARTNER | AI
      //   contentLevel: "SAFE",    // SAFE | SUGGESTIVE
      //   text: "I feel like I'm not being heard.",
      // }
    ],

    insights: {
      lastGeneratedAt: null,
      summary: null,           // high-level summary of the session
      patterns: [],            // e.g. ["defensiveness", "avoidance"]
      suggestedActions: [
        // Example:
        // "Try a 10-minute daily check-in where each person shares one feeling and one need."
      ],
    },

    analytics: {
      userMessages: 0,
      partnerMessages: 0,
      aiMessages: 0,
      turns: 0,                // total back-and-forth units
    },

    system: {
      schemaVersion: 1,
      appVersion: "1.0.0",
    },
  };

  return deepMerge(base, overrides);
}

/**
 * Append a message to a session transcript and update analytics.
 */
function addSessionMessage(sessionDoc, message) {
  const now = new Date().toISOString();

  const msg = {
    id: message.id || `msg_${sessionDoc.transcript.length + 1}`,
    timestamp: message.timestamp || now,
    senderType: message.senderType || "user", // user | partner | ai
    senderId: message.senderId || null,
    role: message.role || "USER",             // USER | PARTNER | AI
    contentLevel: message.contentLevel || "SAFE",
    text: message.text || "",
  };

  sessionDoc.transcript.push(msg);

  // Update analytics
  if (msg.senderType === "user") sessionDoc.analytics.userMessages += 1;
  if (msg.senderType === "partner") sessionDoc.analytics.partnerMessages += 1;
  if (msg.senderType === "ai") sessionDoc.analytics.aiMessages += 1;

  sessionDoc.analytics.turns = sessionDoc.transcript.length;
  sessionDoc.updatedAt = now;

  return sessionDoc;
}

/**
 * Simple deep merge helper for nested objects.
 */
function deepMerge(target, source) {
  if (!source) return target;

  for (const key of Object.keys(source)) {
    const value = source[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof target[key] === "object" &&
      target[key] !== null
    ) {
      target[key] = deepMerge({ ...target[key] }, value);
    } else {
      target[key] = value;
    }
  }

  return target;
}

module.exports = {
  createSessionDoc,
  addSessionMessage,
};