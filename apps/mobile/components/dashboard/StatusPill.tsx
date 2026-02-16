import React from "react";
import { Text, View } from "react-native";

export function StatusPill({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  // No hex colors: use opacity + borders only.
  const borderOpacity = tone === "good" ? 0.35 : tone === "warn" ? 0.28 : tone === "bad" ? 0.4 : 0.18;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        opacity: 0.95,
        borderColor: `rgba(0,0,0,${borderOpacity})`,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", opacity: 0.85 }}>{text}</Text>
    </View>
  );
}
