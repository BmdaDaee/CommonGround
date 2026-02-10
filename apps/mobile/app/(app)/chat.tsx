import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../lib/firebase";
import { api, ensureSession } from "../../lib/api";
import { keystoneRewrite, type RewriteMode } from "../../lib/keystoneClient";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const REWRITE_MODES: { label: string; mode: RewriteMode }[] = [
  { label: "De-escalate", mode: "deescalate" },
  { label: "Soften", mode: "soften" },
  { label: "Emotion → Words", mode: "emotion_to_words" },
  { label: "Boundary Set", mode: "boundary_set" },
];

const REWRITE_ERROR_MESSAGE = "Couldn’t rewrite that right now. Please try again.";

function makeId() {
  return Math.random().toString(36).slice(2);
}

function makeRewriteCacheKey(text: string, mode: RewriteMode) {
  return JSON.stringify([text, mode]);
}

function extractRewriteOutput(result: { output: string } | string) {
  if (typeof result === "string") return result;
  return result.output;
}

export default function ChatScreen() {
  const requestSeqRef = useRef(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [pairId, setPairId] = useState<string | null>(null);
const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [rewriteSourceText, setRewriteSourceText] = useState("");
  const [selectedMode, setSelectedMode] = useState<RewriteMode | null>(null);
  const [rewritePreview, setRewritePreview] = useState("");
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteCache, setRewriteCache] = useState<Record<string, string>>({});

  const canSend = useMemo(() => draft.trim().length > 0 && !isSending, [draft, isSending]);
  const canRewrite = useMemo(() => draft.trim().length >= 12, [draft]);
  const canReplaceDraft = useMemo(() => {
    return !rewriteLoading && !rewriteError && rewritePreview.trim().length > 0;
  }, [rewriteError, rewriteLoading, rewritePreview]);

  

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const session = await ensureSession();
        console.log("[ensureSession]", JSON.stringify(session));
        const pid =
          (session as any)?.pairId ??
          (session as any)?.user?.pairId ??
          (session as any)?.user?.pair?.id ??
          null;
        if (mounted) setPairId(pid);
      } catch {
        // keep pairId null
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

async function onSend() {
    const text = draft.trim();
    if (!text || isSending) return;

    

    if (!pairId) {
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", text: "You're not paired yet, so chat can't send. Pair first." },
      ]);
      return;
    }

setDraft("");
    setMessages((prev) => [...prev, { id: makeId(), role: "user", text }]);
    setIsSending(true);

    try {
      const res = await api.post(`/v1/chat/${pairId}/send`, { text });
      const reply = typeof res.data?.reply === "string" ? res.data.reply : "";

      if (reply) {
        setMessages((prev) => [...prev, { id: makeId(), role: "assistant", text: reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", text: "Message failed to send. Please try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function openRewrite() {
    if (!canRewrite) return;
    setRewriteSourceText(draft);
    setSelectedMode(null);
    setRewritePreview("");
    setRewriteError(null);
    setRewriteLoading(false);
    requestSeqRef.current += 1;
    setIsRewriteOpen(true);
  }

  function closeRewrite() {
    requestSeqRef.current += 1;
    setRewriteLoading(false);
    setRewriteError(null);
    setIsRewriteOpen(false);
  }

  async function onSelectMode(mode: RewriteMode) {
    setSelectedMode(mode);
    setRewriteError(null);

    const sourceText = rewriteSourceText;
    const cacheKey = makeRewriteCacheKey(sourceText, mode);
    const cached = rewriteCache[cacheKey];
    if (cached) {
      setRewritePreview(cached);
      setRewriteLoading(false);
      return;
    }

    const requestId = ++requestSeqRef.current;
    setRewriteLoading(true);
    setRewritePreview("");

    try {
      const rewriteResult = await keystoneRewrite(sourceText, mode);
      if (requestSeqRef.current !== requestId) return;

      const output = extractRewriteOutput(rewriteResult).trim();
      if (!output) throw new Error("empty_rewrite_output");

      setRewritePreview(output);
      setRewriteCache((prev) => ({ ...prev, [cacheKey]: output }));
    } catch {
      if (requestSeqRef.current !== requestId) return;
      setRewriteError(REWRITE_ERROR_MESSAGE);
      setRewritePreview("");
    } finally {
      if (requestSeqRef.current === requestId) setRewriteLoading(false);
    }
  }

  function onReplaceDraft() {
    if (!canReplaceDraft) return;
    setDraft(rewritePreview);
    closeRewrite();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={6}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderColor: "#E6E6E6",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#171717" }}>Chat</Text>
          <Pressable
            onPress={() => signOut(firebaseAuth)}
            style={{
              borderWidth: 1,
              borderColor: "#D4D4D4",
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#171717", fontWeight: "700" }}>Sign Out</Text>
          </Pressable>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={{ color: "#6B7280" }}>
              Start the conversation. Your rewrite stays preview-only until you tap Replace draft.
            </Text>
          }
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            return (
              <View
                style={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isUser ? "#D4F4EC" : "#E6E6E6",
                  backgroundColor: isUser ? "#EFFCF8" : "#FAFAFA",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: "#171717", lineHeight: 20 }}>{item.text}</Text>
              </View>
            );
          }}
        />

        <View
          style={{
            borderTopWidth: 1,
            borderColor: "#E6E6E6",
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: 12,
            backgroundColor: "#FFFFFF",
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type your message..."
            multiline
            style={{
              borderWidth: 1,
              borderColor: "#DADADA",
              borderRadius: 14,
              minHeight: 56,
              maxHeight: 140,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: "#171717",
              textAlignVertical: "top",
            }}
          />

          <View
            style={{
              marginTop: 8,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {canRewrite ? (
              <Pressable
                onPress={openRewrite}
                style={{
                  borderWidth: 1,
                  borderColor: "#D8B4FE",
                  borderRadius: 999,
                  backgroundColor: "#FAF5FF",
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ color: "#6B21A8", fontWeight: "700", fontSize: 13 }}>Rewrite</Text>
              </Pressable>
            ) : (
              <View />
            )}

            <Pressable
              onPress={onSend}
              disabled={!canSend}
              style={{
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 9,
                backgroundColor: canSend ? "#111111" : "#D4D4D4",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{isSending ? "Sending..." : "Send"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={isRewriteOpen} transparent animationType="slide" onRequestClose={closeRewrite}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            onPress={closeRewrite}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.25)" }}
          />

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              paddingHorizontal: 14,
              paddingTop: 14,
              paddingBottom: 18,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Rewrite</Text>
              <Pressable
                onPress={closeRewrite}
                style={{
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: "#111827", fontWeight: "700" }}>Close</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {REWRITE_MODES.map((entry) => {
                const active = selectedMode === entry.mode;
                return (
                  <Pressable
                    key={entry.mode}
                    onPress={() => onSelectMode(entry.mode)}
                    style={{
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? "#7C3AED" : "#D1D5DB",
                      backgroundColor: active ? "#F3E8FF" : "#FFFFFF",
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: "#111827", fontWeight: "700", fontSize: 13 }}>{entry.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                backgroundColor: "#F9FAFB",
                padding: 12,
                minHeight: 110,
              }}
            >
              {rewriteLoading ? (
                <Text style={{ color: "#374151" }}>Rewriting…</Text>
              ) : rewriteError ? (
                <Text style={{ color: "#B91C1C" }}>{rewriteError}</Text>
              ) : rewritePreview ? (
                <Text style={{ color: "#111827", lineHeight: 20 }}>{rewritePreview}</Text>
              ) : (
                <Text style={{ color: "#6B7280" }}>Select a mode to preview a rewrite.</Text>
              )}
            </View>

            <Pressable
              onPress={onReplaceDraft}
              disabled={!canReplaceDraft}
              style={{
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor: canReplaceDraft ? "#111111" : "#D4D4D4",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>Replace draft</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
