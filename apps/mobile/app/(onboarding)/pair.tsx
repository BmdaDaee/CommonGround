import React, { useMemo, useState, useEffect } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";

import { useAuth } from "../../context/AuthContext";
import { apiPost } from "../../lib/api";
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
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setChecking(false);
  }, []);

  useEffect(() => {
    if (alreadyPaired) {
      router.replace("/(tabs)");
    }
  }, [alreadyPaired, router]);

  async function createPair() {
    if (!user) {
      Alert.alert("Not signed in", "Please sign in first.");
      router.push("/(auth)/login");
      return;
    }

    setBusy(true);
    try {
      const res = await apiPost("/v1/pairs", {});
      const code = res?.code || res?.pair?.code || null;
      setCreatedCode(code);

      if (code) {
        Alert.alert("Pair created", `Code: ${code}`);
      } else {
        Alert.alert("Pair created", "Created, but no code returned. Check API response.");
      }
    } catch (err: any) {
      Alert.alert("Create failed", String(err?.message ?? err ?? "unknown_error"));
    } finally {
      setBusy(false);
    }
  }

  async function joinPair() {
    if (!user) {
      Alert.alert("Not signed in", "Please sign in first.");
      router.push("/(auth)/login");
      return;
    }

    const code = joinCode.trim().toUpperCase();
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

  async function copyCreatedCode() {
    if (!createdCode) return;
    await Clipboard.setStringAsync(createdCode);
    Alert.alert("Copied", createdCode);
  }

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <Text style={{ color: theme.text, fontWeight: "700" }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: theme.background }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: theme.text }}>Pair up</Text>
      <Text style={{ color: theme.icon }}>Create a pair code or join your partner’s.</Text>

      {!user && (
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={{
            borderRadius: 16,
            paddingVertical: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: theme.tabIconDefault,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: "800" }}>Sign in</Text>
        </Pressable>
      )}

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

        {createdCode && (
          <View style={{ gap: 8, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: theme.tabIconDefault }}>
            <Text style={{ color: theme.text, fontWeight: "800" }}>Your pair code</Text>
            <Text style={{ color: theme.text, fontSize: 18, letterSpacing: 2 }}>{createdCode}</Text>
            <Pressable
              onPress={copyCreatedCode}
              style={{
                borderRadius: 14,
                paddingVertical: 10,
                alignItems: "center",
                backgroundColor: theme.tabIconDefault,
              }}
            >
              <Text style={{ color: theme.background, fontWeight: "800" }}>Copy code</Text>
            </Pressable>
          </View>
        )}

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
