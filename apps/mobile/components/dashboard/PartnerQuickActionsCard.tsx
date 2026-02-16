import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CGText, Row, Stack, Divider } from "./primitives";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type PartnerQuickActionsCardProps = {
  title?: string;
  onMessage?: () => void;
  onPlan?: () => void;
  onSync?: () => void;
};

export default function PartnerQuickActionsCard({
  title = "Quick actions",
  onMessage = () => {},
  onPlan = () => {},
  onSync = () => {},
}: PartnerQuickActionsCardProps) {
  const scheme = useColorScheme();
  const theme = Colors[scheme ?? "light"];

  const tileBase = { backgroundColor: theme.card, borderColor: theme.icon + "22" };

  return (
    <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon + "22" }]}>
      <Stack gap={10}>
        <CGText style={[styles.title, { color: theme.text }]}>{title}</CGText>
        <Divider opacity={0.25} />

        <Row gap={12} wrap>
          <Pressable onPress={onMessage} style={[styles.tile, tileBase]} accessibilityRole="button">
            <CGText style={styles.emoji}>💬</CGText>
            <CGText style={[styles.tileLabel, { color: theme.text }]}>Message</CGText>
          </Pressable>

          <Pressable onPress={onPlan} style={[styles.tile, tileBase]} accessibilityRole="button">
            <CGText style={styles.emoji}>📅</CGText>
            <CGText style={[styles.tileLabel, { color: theme.text }]}>Plan</CGText>
          </Pressable>

          <Pressable onPress={onSync} style={[styles.tile, tileBase]} accessibilityRole="button">
            <CGText style={styles.emoji}>🔄</CGText>
            <CGText style={[styles.tileLabel, { color: theme.text }]}>Sync</CGText>
          </Pressable>
        </Row>
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  title: { fontSize: 16, fontWeight: "900" },
  tile: {
    flexGrow: 1,
    minWidth: 110,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 8,
  },
  emoji: { fontSize: 28 },
  tileLabel: { fontSize: 13, fontWeight: "800" },
});
