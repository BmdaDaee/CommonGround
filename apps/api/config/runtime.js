const DEV_BACKEND_LOCK = (process.env.DEV_BACKEND_LOCK || "").trim().toLowerCase();

const BACKEND_LOCK = DEV_BACKEND_LOCK || null;

function isSupabaseLocked() {
  return BACKEND_LOCK === "supabase";
}

function assertFirebaseAllowed(caller = "unknown") {
  if (isSupabaseLocked()) {
    throw new Error(
      `[backend-lock] Firebase is disabled when DEV_BACKEND_LOCK=supabase. Caller: ${caller}`
    );
  }
}

function getSessionStore() {
  const requestedStore = (process.env.SESSION_STORE || "memory").trim().toLowerCase() || "memory";

  if (requestedStore === "firebase") {
    assertFirebaseAllowed("SESSION_STORE=firebase");
  }

  return requestedStore;
}

module.exports = {
  BACKEND_LOCK,
  isSupabaseLocked,
  assertFirebaseAllowed,
  getSessionStore,
};
