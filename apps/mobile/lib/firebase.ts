import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";

const requiredEnv = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
] as const;

const missingEnv = requiredEnv.filter((k) => !process.env[k]);

if (missingEnv.length) {
  throw new Error(
    `[env] Missing required environment variables: ${missingEnv.join(
      ", "
    )}. See apps/mobile/.env.example`
  );
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// --- Auth init (React Native) ---
// initializeAuth must only run once. On fast refresh, calling it again causes crashes.
// We store the instance on global to keep it stable across reloads.
declare global {
  // eslint-disable-next-line no-var
  var __cgAuth: ReturnType<typeof initializeAuth> | undefined;
}

function initAuthOnce() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (e: any) {
    // If auth was already initialized, fall back to getAuth()
    return getAuth(app);
  }
}

export const firebaseAuth = global.__cgAuth || (global.__cgAuth = initAuthOnce());
export const firestore = getFirestore(app);
