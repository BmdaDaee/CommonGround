import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

export default function AuthScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme ?? "light"];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) Alert.alert("Sign in failed", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function signUp() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) Alert.alert("Sign up failed", error.message);
      else Alert.alert("Check email", "Confirm your email, then sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: theme.background }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text }}>CommonGround</Text>
      <Text style={{ opacity: 0.75, color: theme.text }}>Sign in to continue</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={theme.tabIconDefault}
        style={{ borderWidth: 1, borderColor: theme.tabIconDefault, borderRadius: 12, padding: 12, color: theme.text }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={theme.tabIconDefault}
        style={{ borderWidth: 1, borderColor: theme.tabIconDefault, borderRadius: 12, padding: 12, color: theme.text }}
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={signIn}
          disabled={busy}
          style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: "center", backgroundColor: theme.tint, opacity: busy ? 0.7 : 1 }}
        >
          <Text style={{ fontWeight: "800", color: theme.background }}>Sign in</Text>
        </Pressable>

        <Pressable
          onPress={signUp}
          disabled={busy}
          style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: theme.tabIconDefault, opacity: busy ? 0.7 : 1 }}
        >
          <Text style={{ fontWeight: "800", color: theme.text }}>Sign up</Text>
        </Pressable>
      </View>
    </View>
  );
}
