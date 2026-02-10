import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { router, useSegments } from "expo-router";
import { firebaseAuth } from "./firebase";
import { ensureSession } from "./api";
import { getSessionPairId } from "./pairing";

const AUTH_GATE_WATCHDOG_MS = 12000;
type AuthRoute = "/(auth)/sign-in" | "/(onboarding)/pair" | "/(app)/chat";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const segments = useSegments();

  const currentRoute = useMemo<AuthRoute | null>(() => {
    const route = `/${segments.join("/")}`;
    if (route === "/(auth)/sign-in") return route;
    if (route === "/(onboarding)/pair") return route;
    if (route === "/(app)/chat") return route;
    return null;
  }, [segments]);

  const currentRouteRef = useRef<AuthRoute | null>(null);
  currentRouteRef.current = currentRoute;

  useEffect(() => {
    let mounted = true;
    let settled = false;

    const finish = (route: AuthRoute) => {
      if (!mounted || settled) return;
      settled = true;
      setReady(true);
      if (currentRouteRef.current !== route) {
        router.replace(route);
      }
    };

    const watchdog = setTimeout(() => {
      finish("/(auth)/sign-in");
    }, AUTH_GATE_WATCHDOG_MS);

    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!mounted) return;

      if (!user) {
        clearTimeout(watchdog);
        finish("/(auth)/sign-in");
        return;
      }

      try {
        const session = await ensureSession();
        const pairId = getSessionPairId(session);

        clearTimeout(watchdog);
        if (!pairId) finish("/(onboarding)/pair");
        else finish("/(app)/chat");
      } catch {
        clearTimeout(watchdog);
        finish("/(auth)/sign-in");
      }
    });

    return () => {
      mounted = false;
      clearTimeout(watchdog);
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
