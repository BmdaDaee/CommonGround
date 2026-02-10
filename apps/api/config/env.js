function validateApiEnv() {
  const errors = [];
  const isProduction = (process.env.NODE_ENV || "").toLowerCase() === "production";
  const devBackendLock = typeof process.env.DEV_BACKEND_LOCK === "string"
    ? process.env.DEV_BACKEND_LOCK.trim().toLowerCase()
    : "";
  const sessionStore = (process.env.SESSION_STORE || "memory").toLowerCase();
  const chatBackend = typeof process.env.CHAT_BACKEND === "string"
    ? process.env.CHAT_BACKEND.trim().toLowerCase()
    : "";
  const pairBackend = typeof process.env.PAIR_BACKEND === "string"
    ? process.env.PAIR_BACKEND.trim().toLowerCase()
    : "";

  if (sessionStore === "firebase" && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    errors.push("FIREBASE_SERVICE_ACCOUNT_PATH (required when SESSION_STORE=firebase)");
  }

  if (!chatBackend) {
    errors.push('CHAT_BACKEND is required and must be "firebase" or "supabase"');
  } else if (chatBackend !== "firebase" && chatBackend !== "supabase") {
    errors.push('CHAT_BACKEND must be either "firebase" or "supabase"');
  }

  if (!pairBackend) {
    errors.push('PAIR_BACKEND is required and must be "firebase" or "supabase"');
  } else if (pairBackend !== "firebase" && pairBackend !== "supabase") {
    errors.push('PAIR_BACKEND must be either "firebase" or "supabase"');
  }

  if (chatBackend && pairBackend && chatBackend !== pairBackend) {
    throw new Error("[env] Mixed backend mode is not allowed. CHAT_BACKEND and PAIR_BACKEND must match.");
  }

  if (devBackendLock && devBackendLock !== "supabase") {
    errors.push('DEV_BACKEND_LOCK must be "supabase" when set');
  }

  if (isProduction && devBackendLock) {
    errors.push("DEV_BACKEND_LOCK must be unset in production");
  }

  if (isProduction) {
    if (chatBackend && chatBackend !== "firebase") {
      errors.push('CHAT_BACKEND must be "firebase" in production');
    }
    if (pairBackend && pairBackend !== "firebase") {
      errors.push('PAIR_BACKEND must be "firebase" in production');
    }
  }

  if (!isProduction && devBackendLock === "supabase") {
    if (chatBackend && chatBackend !== "supabase") {
      errors.push('CHAT_BACKEND must be "supabase" when DEV_BACKEND_LOCK=supabase');
    }
    if (pairBackend && pairBackend !== "supabase") {
      errors.push('PAIR_BACKEND must be "supabase" when DEV_BACKEND_LOCK=supabase');
    }
    if (!process.env.SUPABASE_URL) {
      errors.push("SUPABASE_URL (required for Supabase mode)");
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push("SUPABASE_SERVICE_ROLE_KEY (required for Supabase mode)");
    }
  }

  if (!errors.length) return;

  throw new Error(
    `[env] Invalid backend configuration:\n- ${errors.join(
      "\n- "
    )}\nSee apps/api/.env.example`
  );
}

module.exports = {
  validateApiEnv,
};
