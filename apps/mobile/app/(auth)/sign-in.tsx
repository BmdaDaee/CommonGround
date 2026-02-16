import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
    return email.trim().length > 3 && password.length >= 6 && !busy;
  }, [email, password, busy]);

  async function signIn() {
    const e = email.trim();
    if (!e || !password) return;

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

      if (!data.session) {
        Alert.alert(
          "Sign in incomplete",
          "No session returned. If email confirmation is enabled, confirm the email first."
        );
        return;
      }

      router.replace("/(onboarding)/pair");
    } finally {
      setBusy(false);
    }
  }

  async function signUp() {
    const e = email.trim();
    if (!e || !password) return;

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
      });

      if (error) {
        Alert.alert("Sign up failed", error.message);
        return;
      }

      if (!data.session) {
        Alert.alert(
          "Check your email",
          "Account created. If email confirmations are enabled, confirm your email before signing in."
        );
        return;
      }

      router.replace("/(onboarding)/pair");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>CommonGround</Text>
      <Text style={{ color: theme.icon, marginBottom: 16 }}>Sign in to continue</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={theme.tabIconDefault}
        style={[
          styles.input,
          { borderColor: theme.tabIconDefault, color: theme.text },
        ]}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={theme.tabIconDefault}
        style={[
          styles.input,
          { borderColor: theme.tabIconDefault, color: theme.text },
        ]}
      />

      <Pressable
        onPress={signIn}
        disabled={!canSubmit}
        style={[
          styles.button,
          {
            backgroundColor: theme.tint,
            opacity: canSubmit ? 1 : 0.5,
          },
        ]}
      >
        <Text style={{ color: theme.background, fontWeight: "800" }}>
          {busy ? "Signing in…" : "Sign in"}
        </Text>
      </Pressable>

      <Pressable
        onPress={signUp}
        disabled={!canSubmit}
        style={[
          styles.button,
          {
            borderColor: theme.tabIconDefault,
            backgroundColor: "transparent",
            opacity: canSubmit ? 1 : 0.5,
          },
        ]}
      >
        <Text style={{ color: theme.text, fontWeight: "800" }}>
          {busy ? "Working…" : "Sign up"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  button: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 10 },
});
