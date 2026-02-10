import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { Redirect, useSegments } from "expo-router";
import { firebaseAuth } from "./firebase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";

  // Signed out: force auth routes
  if (!user && !inAuthGroup) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Signed in: keep out of auth routes
  if (user && inAuthGroup) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}
