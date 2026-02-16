import React, { useMemo, useState, useEffect } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { apiGet, apiPost } from "../../lib/api";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

export default function PairUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const { user, pairId } = useAuth();

  const alreadyPaired = useMemo(() => Boolean(pairId), [pairId]);
  const [checking, setChecking] = useState(true);

  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        if (!user) {
          if (alive) setChecking(false);
          return;
        }

        const res = await apiGet("/v1/pairs/me");
        const existing = res?.pair?.id ? true : false;

        if (!alive) return;

        if (existing) {
          router.replace("/(tabs)");
          return;
        }

        setChecking(false);
      } catch {
        if (alive) setChecking(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [user, router]);

  useEffect(() => {
    if (alreadyPaired) {
      router.replace("/(tabs)");
    }
  }, [alreadyPaired, router]);

  async function createPair() {
    if (!user) {
      Alert.alert("Not signed in", "Please sign in first.");
      return;
    }

    setBusy(true);
    try {
      await apiPost("/v1/pairs", {});
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Create failed", String(err?.message ?? err ?? "unknown_error"));
    } finally {
      setBusy(false);
    }
  }

  async function joinPair() {
    if (!user) {
      Alert.alert("Not signed in", "Please sign in first.");
      return;
    }

    const code = joinCode.trim();
    if (!code) {
      Alert.alert("Join failed", "Enter a pair code.");
      return;
    }

    setBusy(true);
    try {
      await apiPost("/v1/pairs/join", { code });
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Join failed", String(err?.message ?? err ?? "unknown_error"));
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <Text style={{ color: theme.text, fontWeight: "700" }}>Checking pairing…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: theme.background }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: theme.text }}>Pair up</Text>
      <Text style={{ color: theme.icon }}>Create a pair code or join your partner’s.</Text>

      <View style={{ gap: 10, marginTop: 8 }}>
        <Pressable
          onPress={createPair}
          disabled={busy}
          style={{
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: theme.tint,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text style={{ color: theme.background, fontWeight: "800" }}>Create pair</Text>
        </Pressable>

        <View style={{ height: 10 }} />

        <TextInput
          value={joinCode}
          onChangeText={setJoinCode}
          placeholder="Enter pair code"
          placeholderTextColor={theme.tabIconDefault}
          autoCapitalize="characters"
          style={{
            borderWidth: 1,
            borderColor: theme.tabIconDefault,
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 12,
            color: theme.text,
          }}
        />

        <Pressable
          onPress={joinPair}
          disabled={busy}
          style={{
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: theme.tint,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text style={{ color: theme.background, fontWeight: "800" }}>Join pair</Text>
        </Pressable>
      </View>
    </View>
  );
}
