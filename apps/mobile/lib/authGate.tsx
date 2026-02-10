import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { firebaseAuth } from "./firebase";
import { ensureSession } from "./api";
import { getSessionPairId } from "./pairing";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      console.log('[AuthGate] auth state changed. user=', !!user);
      console.log('[AuthGate] auth state changed. user=', !!user);
      if (!mounted) return;

      if (!user) {
        console.log('[AuthGate] setReady(true)');
        console.log('[AuthGate] setReady(true)');
        setReady(true);
        router.replace("/(auth)/sign-in");
        return;
      }

      try {
        console.log('[AuthGate] calling ensureSession');
        console.log('[AuthGate] calling ensureSession');
        const session = await ensureSession();
        console.log('[AuthGate] ensureSession ok');
        console.log('[AuthGate] ensureSession ok');
        const pairId = getSessionPairId(session);
        console.log('[AuthGate] pairId=', pairId);
        console.log('[AuthGate] pairId=', pairId);

        setReady(true);

        if (!pairId) {
          router.replace("/(onboarding)/pair");
        } else {
          router.replace("/(app)/chat");
        }
      } catch (e) {
        console.log('[AuthGate] ensureSession failed', (e as any)?.message, (e as any)?.response?.status, (e as any)?.response?.data);
        console.log('[AuthGate] ensureSession failed', (e as any)?.message, (e as any)?.response?.status, (e as any)?.response?.data);
        setReady(true);
        router.replace("/(auth)/sign-in");
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}
