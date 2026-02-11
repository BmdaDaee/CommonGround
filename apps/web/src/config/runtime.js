const rawBackendLock = (import.meta.env.VITE_DEV_BACKEND_LOCK || "").trim().toLowerCase();

export const backendLock = rawBackendLock || null;
export const isSupabaseLocked = backendLock === "supabase";
export const apiBaseUrl = (import.meta.env.VITE_CG_API_BASE_URL || "").trim();
