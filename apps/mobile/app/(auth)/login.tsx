import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { supabase } from "../../lib/supabase";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(email.trim()) && Boolean(password);
  }, [email, password]);

  async function onSignIn() {
    if (busy) return;

    const e = email.trim();
    if (!e || !password) {
      Alert.alert("Missing info", "Enter email and password.");
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: e,
        password,
      });

      if (error) {
        Alert.alert("Sign in failed", error.message);
        return;
      }

      if (!data.session?.access_token) {
        Alert.alert("Sign in failed", "No session returned.");
        return;
      }

      router.replace("/(onboarding)/pair");
    } catch (err: any) {
      Alert.alert("Sign in failed", String(err?.message ?? err ?? "unknown_error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: "center", backgroundColor: theme.background }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: theme.text }}>Sign in</Text>
      <Text style={{ color: theme.icon }}>Use the same account you created in Supabase Auth.</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={theme.tabIconDefault}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: theme.tabIconDefault,
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 12,
          color: theme.text,
        }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={theme.tabIconDefault}
        secureTextEntry
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
        onPress={onSignIn}
        disabled={!canSubmit || busy}
        style={{
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          backgroundColor: theme.tint,
          opacity: !canSubmit || busy ? 0.6 : 1,
        }}
      >
        <Text style={{ color: theme.background, fontWeight: "800" }}>
          {busy ? "Signing in…" : "Sign in"}
        </Text>
      </Pressable>
    </View>
  );
}
