// models/user.js

/**
 * Create a new user document with default fields.
 * This is the shape your database will store later.
 */

function createUserDoc(userId, overrides = {}) {
  const now = new Date().toISOString();

  const base = {
    id: userId,
    createdAt: now,
    updatedAt: now,

    profile: {
      displayName: null,
      avatarUrl: null,
      dob: null,       // e.g. "2000-05-12"
      isAdult: false,  // must be set true after age check
    },

    settings: {
      nsfwEnabled: false,
      nsfwLastConfirmedAt: null,
      contentLevelPreference: "SAFE", // SAFE | SUGGESTIVE | EXPLICIT
      language: "en-US",
      theme: "dark",
    },

    relationship: {
      partnerId: null,
      status: "SINGLE",        // SINGLE | LINK_PENDING | LINKED | UNLINKED
      linkedAt: null,
      allowNSFWSharing: false,
    },

    aiPreferences: {
      personaMode: "DEFAULT",
      voiceTone: "balanced",   // balanced | playful | serious | blunt etc.
      safetyMode: "STRICT",    // STRICT | RELAXED (still non-explicit)
      historyRetention: true,
    },

    analytics: {
      messagesSent: 0,
      messagesReceived: 0,
      lastActiveAt: now,
    },

    system: {
      appVersion: "1.0.0",
      schemaVersion: 1,
    },
  };

  // Allow overrides for specific fields
  return deepMerge(base, overrides);
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
  createUserDoc,
};