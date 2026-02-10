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
import { useRouter } from "expo-router";
import { api, ensureSession } from "../../lib/api";
import { getSessionPairId } from "../../lib/pairing";

type BusyState = "bootstrap" | "create" | "join" | null;

function toFriendlyError(err: unknown, fallback: string) {
  if (typeof err === "object" && err) {
    const message = (err as { response?: { data?: { error?: unknown; message?: unknown } } }).response?.data?.error;
    if (typeof message === "string" && message.trim().length > 0) return message;

    const altMessage = (err as { response?: { data?: { error?: unknown; message?: unknown } } }).response?.data?.message;
    if (typeof altMessage === "string" && altMessage.trim().length > 0) return altMessage;

    const directMessage = (err as { message?: unknown }).message;
    if (typeof directMessage === "string" && directMessage.trim().length > 0) return directMessage;
  }

  return fallback;
}

export default function PairScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState<BusyState>("bootstrap");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const session = await ensureSession();
        const pairId = getSessionPairId(session);
        if (!mounted) return;
        if (pairId) {
          router.replace("/(app)/chat");
          return;
        }
      } catch {
        // ignore bootstrap errors and let user try create/join
      } finally {
        if (mounted) setBusy(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const joinCode = useMemo(() => joinCodeInput.trim().toUpperCase(), [joinCodeInput]);
  const isBusy = busy !== null;
  const canCreate = !isBusy;
  const canJoin = !isBusy && joinCode.length > 0;

  async function refreshSessionAndGoToChat() {
    const session = await ensureSession();
    const pairId = getSessionPairId(session);
    if (!pairId) {
      throw new Error("Pairing completed, but your session has no active pair yet. Please try once more.");
    }
    router.replace("/(app)/chat");
  }

  async function onCreatePair() {
    if (!canCreate) return;
    setBusy("create");
    setError(null);
    setCreatedCode(null);

    try {
      const res = await api.post("/v1/pair/create");
      const rawCode =
        (res.data as { code?: unknown; joinCode?: unknown; inviteCode?: unknown })?.code ??
        (res.data as { code?: unknown; joinCode?: unknown; inviteCode?: unknown })?.joinCode ??
        (res.data as { code?: unknown; joinCode?: unknown; inviteCode?: unknown })?.inviteCode ??
        null;
      const normalizedCode = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
      if (normalizedCode) {
        setCreatedCode(normalizedCode);
      }

      await refreshSessionAndGoToChat();
    } catch (err: unknown) {
      setError(toFriendlyError(err, "Couldn’t create a pair right now. Please try again."));
    } finally {
      setBusy(null);
    }
  }

  async function onJoinPair() {
    if (!canJoin) return;
    setBusy("join");
    setError(null);

    try {
      await api.post("/v1/pair/join", { code: joinCode });
      await refreshSessionAndGoToChat();
    } catch (err: unknown) {
      setError(toFriendlyError(err, "Couldn’t join that code. Check it and try again."));
    } finally {
      setBusy(null);
    }
  }

  if (busy === "bootstrap") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, gap: 10 }}>
        <ActivityIndicator />
        <Text style={{ color: "#4B5563", textAlign: "center" }}>Loading pairing status…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 14 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#111827", textAlign: "center" }}>Pair Your Account</Text>
        <Text style={{ color: "#4B5563", textAlign: "center" }}>
          Create a pair to share a code, or join with a code from your partner.
        </Text>

        {createdCode ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#D1FAE5",
              borderRadius: 14,
              backgroundColor: "#ECFDF5",
              paddingVertical: 14,
              paddingHorizontal: 16,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text style={{ color: "#065F46", fontWeight: "700" }}>Your join code</Text>
            <Text style={{ color: "#065F46", fontSize: 30, fontWeight: "900", letterSpacing: 3 }}>{createdCode}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onCreatePair}
          disabled={!canCreate}
          style={{
            backgroundColor: canCreate ? "#111111" : "#D1D5DB",
            borderRadius: 12,
            paddingVertical: 13,
            alignItems: "center",
          }}
        >
          {busy === "create" ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 16 }}>Create Pair</Text>
          )}
        </Pressable>

        <View style={{ gap: 8 }}>
          <Text style={{ color: "#374151", fontWeight: "700" }}>Join with code</Text>
          <TextInput
            value={joinCodeInput}
            onChangeText={setJoinCodeInput}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Enter code"
            placeholderTextColor="#9CA3AF"
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 11,
              color: "#111827",
            }}
          />
          <Pressable
            onPress={onJoinPair}
            disabled={!canJoin}
            style={{
              backgroundColor: canJoin ? "#2563EB" : "#BFDBFE",
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: "center",
            }}
          >
            {busy === "join" ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 16 }}>Join Pair</Text>
            )}
          </Pressable>
        </View>

        {error ? <Text style={{ color: "#B91C1C", textAlign: "center" }}>{error}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}
