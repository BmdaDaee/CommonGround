import { initializeApp, getApps } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
const { getReactNativePersistence } = require("firebase/auth") as {
  getReactNativePersistence: (storage: typeof ReactNativeAsyncStorage) => any;
};

const requiredEnv = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnv.length) {
  throw new Error(
    `[env] Missing required environment variables: ${missingEnv.join(
      ", "
    )}. See apps/mobile/.env.example`
  );
}

// Expo public env vars (set in apps/mobile/.env).
const firebaseConfig = {
  apiKey: requiredEnv.EXPO_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: requiredEnv.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: requiredEnv.EXPO_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: requiredEnv.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: requiredEnv.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: requiredEnv.EXPO_PUBLIC_FIREBASE_APP_ID as string,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseAuth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const firestore = getFirestore(app);
