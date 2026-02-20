import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Mode, ModeToggle, ChatBubble } from "@cg/ui";
import { useAuth } from "../../context/AuthContext";
import { apiGet, apiPost } from "../../lib/api";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

type ChatMessage = {
  id: string;
  text: string;
  authorType: "self" | "partner" | "system";
  createdAt: number;
  authorUid?: string;
};

function createMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const { user, pairId } = useAuth();
  const [mode, setMode] = useState<Mode>("commonground");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const list = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  );

  const load = useCallback(async () => {
    if (!pairId) return;
    const res = await apiGet(`/v1/chat/${pairId}/list?limit=50`);
    setMessages(res.messages ?? []);
  }, [pairId]);

  async function send() {
    if (!user) {
      Alert.alert("Not signed in", "Sign in first, then try again.");
      return;
    }
    if (!pairId) {
      Alert.alert("Not paired", "Pair with someone before sending messages.");
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    const messageId = createMessageId();
    setText("");

    const optimistic: ChatMessage = {
      id: messageId,
      text: trimmed,
      authorType: "self",
      createdAt: Date.now(),
      authorUid: user.id,
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      setSending(true);
      await apiPost(`/v1/chat/${pairId}/send`, { messageId, text: trimmed, mode });
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Unknown error";
      Alert.alert("Send failed", msg);
      await load();
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const systemHeader: ChatMessage = {
    id: "system-hello",
    text: "BentlyAI: Keep it cute, keep it honest. You’re both here now.",
    authorType: "system",
    createdAt: 0,
  };

  const sendDisabled = sending || !text.trim();
  const sendButtonColor = theme.tint;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8, color: theme.text }}>
          Chat
        </Text>
        <ModeToggle mode={mode} onChange={setMode} />
      </View>

      <FlatList
        data={[systemHeader, ...list]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <ChatBubble
            mode={mode}
            author={
              item.authorType === "system"
                ? "system"
                : item.authorUid && item.authorUid === user?.id
                ? "self"
                : "partner"
            }
            text={item.text}
            timestamp={
              item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : undefined
            }
          />
        )}
        refreshing={loading}
        onRefresh={load}
      />

      <View style={{ flexDirection: "row", padding: 12, borderTopWidth: 1, borderColor: theme.tabIconDefault }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type something real…"
          placeholderTextColor={theme.tabIconDefault}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.tabIconDefault,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 10,
            color: theme.text,
          }}
        />
        <TouchableOpacity
          onPress={send}
          disabled={sendDisabled}
          style={{
            marginLeft: 10,
            borderRadius: 999,
            paddingHorizontal: 16,
            justifyContent: "center",
            backgroundColor: sendButtonColor,
            opacity: sendDisabled ? 0.6 : 1,
          }}
        >
          <Text style={{ fontWeight: "700", color: theme.background }}>
            {sending ? "..." : "Send"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
