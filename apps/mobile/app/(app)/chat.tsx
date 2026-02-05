import React, { useEffect, useMemo, useState } from "react";
import { FlatList, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { Mode, ModeToggle, ChatBubble } from "@cg/ui";
import { useAuth } from "../../context/AuthContext";
import { apiGet, apiPost } from "../../lib/api";

type ChatMessage = {
  id: string;
  text: string;
  authorType: "self" | "partner" | "system";
  createdAt: number;
  authorUid?: string;
};

export default function ChatScreen() {
  const { user, pairId } = useAuth();
  const [mode, setMode] = useState<Mode>("commonground");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const list = useMemo(() => [...messages].sort((a, b) => a.createdAt - b.createdAt), [messages]);

  async function load() {
    if (!pairId) return;
    const res = await apiGet(`/v1/chat/${pairId}/list?limit=50`);
    setMessages(res.messages ?? []);
  }

  async function send() {
    if (!pairId || !user) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const messageId = uuidv4();
    setText("");

    // Optimistic insert (idempotent server write makes retries safe)
    const optimistic: ChatMessage = {
      id: messageId,
      text: trimmed,
      authorType: "self",
      createdAt: Date.now(),
      authorUid: user.uid
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await apiPost(`/v1/chat/${pairId}/send`, { messageId, text: trimmed });
    } catch (e) {
      // If send fails, reload to reconcile. (Yes, annoying. Also reliable.)
      await load();
    }
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [pairId]);

  const systemHeader = {
    id: "system-hello",
    text: "Shantell: Keep it cute, keep it honest. You’re both here now.",
    authorType: "system" as const,
    createdAt: 0
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: mode === "deeplyus" ? "#9966CC" : "#FFFFF2" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Chat</Text>
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
                : item.authorUid && item.authorUid === user?.uid
                ? "self"
                : "partner"
            }
            text={item.text}
            timestamp={item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined}
          />
        )}
        refreshing={loading}
        onRefresh={load}
      />

      <View style={{ flexDirection: "row", padding: 12, borderTopWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type something real…"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.15)",
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 10
          }}
        />
        <TouchableOpacity
          onPress={send}
          style={{
            marginLeft: 10,
            borderRadius: 999,
            paddingHorizontal: 16,
            justifyContent: "center",
            backgroundColor: mode === "deeplyus" ? "#8B0000" : "#92EAD9"
          }}
        >
          <Text style={{ fontWeight: "700" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
