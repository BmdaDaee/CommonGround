import React from "react";
import { Pressable, Text, View } from "react-native";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../lib/firebase";

export default function ChatScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Chat</Text>

      <Pressable
        onPress={() => signOut(firebaseAuth)}
        style={{
          backgroundColor: "#111",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>Sign Out</Text>
      </Pressable>
    </View>
  );
}
