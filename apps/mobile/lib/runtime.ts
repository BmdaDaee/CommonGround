const backendLock = (process.env.EXPO_PUBLIC_DEV_BACKEND_LOCK || '').trim().toLowerCase();

export const isSupabaseLocked = backendLock === 'supabase';

export function assertFirebaseAllowed(callsite: string) {
  if (isSupabaseLocked) {
    throw new Error(
      `[BackendLock] Firebase access blocked at ${callsite} because EXPO_PUBLIC_DEV_BACKEND_LOCK=supabase.`
    );
  }
}
