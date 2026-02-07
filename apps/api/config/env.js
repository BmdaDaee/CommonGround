function validateApiEnv() {
  const missing = [];
  const sessionStore = (process.env.SESSION_STORE || "memory").toLowerCase();

  if (sessionStore === "firebase" && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    missing.push("FIREBASE_SERVICE_ACCOUNT_PATH (required when SESSION_STORE=firebase)");
  }

  if (!missing.length) return;

  throw new Error(
    `[env] Missing required environment variables:\n- ${missing.join(
      "\n- "
    )}\nSee apps/api/.env.example`
  );
}

module.exports = {
  validateApiEnv,
};
