import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { deeplyUsTheme } from "../theme/deeplyUsTheme";
import { commonGroundTheme } from "../theme/commonGroundTheme";

export type AuthorType = "self" | "partner" | "system";
export type AppMode = "commonground" | "deeplyus";

export function ChatBubble({
  mode,
  author,
  text,
  timestamp
}: {
  mode: AppMode;
  author: AuthorType;
  text: string;
  timestamp?: string;
}) {
  const theme: any = mode === "deeplyus" ? deeplyUsTheme : commonGroundTheme;
  const isSelf = author === "self";
  const isSystem = author === "system";

  let bg = (theme as any).colors.chatOther ?? theme.colors.chip;
  let color = theme.colors.textPrimary;
  let align: "flex-start" | "flex-end" | "center" = "flex-start";

  if (mode === "deeplyus") {
    if (isSelf) {
      bg = deeplyUsTheme.colors.chatSelf;
      color = "#FFFFF2";
      align = "flex-end";
    } else if (author === "partner") {
      bg = deeplyUsTheme.colors.chatPartner;
      color = "#FFFFF2";
      align = "flex-start";
    } else if (isSystem) {
      bg = deeplyUsTheme.colors.chatSystem;
      color = "#FFFFF2";
      align = "center";
    }
  } else {
    if (isSelf) {
      bg = commonGroundTheme.colors.chatSelf;
      color = commonGroundTheme.colors.textPrimary;
      align = "flex-end";
    } else if (author === "partner") {
      bg = commonGroundTheme.colors.chatOther;
      color = commonGroundTheme.colors.textPrimary;
      align = "flex-start";
    } else if (isSystem) {
      bg = commonGroundTheme.colors.chip;
      color = commonGroundTheme.colors.textPrimary;
      align = "center";
    }
  }

  return (
    <View style={[styles.row, { justifyContent: align }]}>
      <View style={[styles.bubble, { backgroundColor: bg, borderRadius: theme.radii.bubble }]}>
        <Text style={[styles.text, { color }]}>{text}</Text>
        {timestamp ? <Text style={[styles.time, { color }]}>{timestamp}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: 8 },
  bubble: {
    maxWidth: "78%",
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  text: { fontSize: 14 },
  time: { marginTop: 4, fontSize: 11, opacity: 0.7, textAlign: "right" }
});
