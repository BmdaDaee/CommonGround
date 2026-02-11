const rawBackendLock = (process.env.EXPO_PUBLIC_DEV_BACKEND_LOCK || process.env.DEV_BACKEND_LOCK || '').trim().toLowerCase();

export const backendLock = rawBackendLock || null;
export const isSupabaseLocked = backendLock === 'supabase';

export const apiBaseURL = (process.env.EXPO_PUBLIC_CG_API_BASE_URL || 'http://localhost:3001').trim();

export function assertFirebaseAllowed(caller: string) {
  if (isSupabaseLocked) {
    throw new Error(
      `[backend-lock] Firebase is disabled when DEV_BACKEND_LOCK=supabase. Caller: ${caller}`
    );
  }
}
