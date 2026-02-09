
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { firebaseAuth } from "../../lib/firebase";
import { commonGroundTheme as theme } from "@cg/ui";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !loading;
  }, [email, password, loading]);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const e = email.trim();
      if (mode === "signin") {
        await signInWithEmailAndPassword(firebaseAuth, e, password);
      } else {
        await createUserWithEmailAndPassword(firebaseAuth, e, password);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={{ flex: 1, justifyContent: "center", padding: (theme as any)?.spacing?.md ?? 16, gap: (theme as any)?.spacing?.sm ?? 10 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", textAlign: "center", color: (theme as any)?.colors?.textPrimary ?? "#1A1A1A" }}>
          {mode === "signin" ? "Sign In" : "Create Account"}
        </Text>

        <View style={{ gap: (theme as any)?.spacing?.sm ?? 10 }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#9A8FA0"
            style={{
              borderWidth: 1,
              borderColor: theme.colors.secondary,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.input,
              padding: 12,
              fontSize: 16,
              color: (theme as any)?.colors?.textPrimary ?? "#1A1A1A",
            }}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password (min 6 chars)"
            placeholderTextColor="#9A8FA0"
            style={{
              borderWidth: 1,
              borderColor: theme.colors.secondary,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.input,
              padding: 12,
              fontSize: 16,
              color: (theme as any)?.colors?.textPrimary ?? "#1A1A1A",
            }}
          />
        </View>

        {!!error && (
          <Text style={{ color: "#B00020", textAlign: "center" }}>
            {error}
          </Text>
        )}

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={{
            backgroundColor: canSubmit ? theme.colors.primary : "#CFC3D6",
            padding: 14,
            borderRadius: theme.radius.button,
            alignItems: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: (theme as any)?.colors?.textPrimary ?? "#1A1A1A", fontSize: 16, fontWeight: "800" }}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          style={{ padding: 10, alignItems: "center" }}
        >
          <Text style={{ textAlign: "center", color: theme.colors.depth, fontWeight: "600" }}>
            {mode === "signin"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
