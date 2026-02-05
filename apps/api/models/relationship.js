// models/relationship.js

/**
 * Create a new relationship document with default fields.
 * This represents the shared space between TWO users.
 *
 * relationshipId: string (e.g. "rel_abc123")
 * overrides: optional nested object to override defaults
 */

function createRelationshipDoc(relationshipId, overrides = {}) {
  const now = new Date().toISOString();

  const base = {
    id: relationshipId,
    createdAt: now,
    updatedAt: now,

    partners: {
      userA: null,               // user id string
      userB: null,               // user id string
      linkedAt: null,            // timestamp when link was confirmed
      status: "PENDING",         // PENDING | ACTIVE | PAUSED | ENDED
    },

    permissions: {
      allowHistorySharing: true,   // Let AI see shared convo history?
      allowConflictAnalysis: true, // Let AI analyze patterns in arguments?
      allowIntimacyCoaching: true, // PG-13 intimacy & emotional coaching
      allowNSFWSharing: false,     // Adults-only, both must opt-in; NOT for OpenAI
      allowJointAIResponses: true, // AI can respond to both in shared sessions
    },

    communication: {
      tonePreference: "balanced",      // balanced | playful | serious | blunt
      aiPersonaMode: "COUPLE_DEFAULT", // mode for couple coaching persona
      conversationGoals: [],           // e.g. ["improve communication", "feel closer"]
      blockedTopics: [],               // e.g. ["infidelity"], optional safety
    },

    intimacy: {
      comfortLevels: {
        physical: null,      // 1–5, nullable if not set yet
        emotional: null,
        communication: null,
      },
      sharedBoundaries: [
        // High-level, non-explicit boundaries. Example:
        // "no yelling during conflict",
        // "take breaks when either person feels overwhelmed"
      ],
      relationshipVision: null, // e.g. "We want to rebuild trust and feel safe."
      checkins: [
        // Example entry:
        // {
        //   timestamp: "2025-12-09T18:22:00.000Z",
        //   summary: "We had a good conversation about needs and expectations."
        // }
      ],
    },

    analytics: {
      messagesExchanged: 0,
      aiSessionsCompleted: 0,
      lastInteractionAt: null,
    },

    system: {
      schemaVersion: 1,
      appVersion: "1.0.0",
    },
  };

  return deepMerge(base, overrides);
}

/**
 * Simple deep merge helper for nested objects.
 * Same as in user.js so behavior is consistent.
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
  createRelationshipDoc,
};