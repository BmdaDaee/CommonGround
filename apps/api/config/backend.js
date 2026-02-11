const backendLock = (process.env.DEV_BACKEND_LOCK || "").trim().toLowerCase();

function getRuntimeBackend() {
  return backendLock === "supabase" ? "supabase" : "firebase";
}

function isSupabaseLocked() {
  return getRuntimeBackend() === "supabase";
}

module.exports = {
  backendLock,
  getRuntimeBackend,
  isSupabaseLocked,
};
