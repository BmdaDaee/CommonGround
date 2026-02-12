import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

const isBrowser = typeof window !== "undefined";
const noopStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};

export const supabase = createClient(url, anonKey, {
  auth: {
    // Expo Router renders web routes in Node first; avoid window/localStorage there.
    storage: isBrowser ? AsyncStorage : noopStorage,
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: false,
  },
});
