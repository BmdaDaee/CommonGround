import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Badge, CGText, Divider, Row, Stack } from "./primitives";

export type SharedRitualCardProps = {
  title?: string;
  completed?: boolean;
  ritualName?: string;
  actionLabel?: string;
  disabled?: boolean;
  onComplete?: () => void;
  onReset?: () => void;
};

export default function SharedRitualCard({
  title = "Shared Ritual",
  completed = false,
  ritualName = "Check-in + one kind text",
  actionLabel,
  disabled = false,
  onComplete,
  onReset,
}: SharedRitualCardProps) {
  return (
    <View style={styles.card}>
      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <CGText style={styles.title}>{title}</CGText>
          <Badge>
            <CGText style={styles.badgeText}>{completed ? "Done" : "Pending"}</CGText>
          </Badge>
        </Row>

        <Divider opacity={0.15} />

        <CGText style={styles.bodyText}>{ritualName}</CGText>

        <Row gap={10} wrap>
          <Pressable
            disabled={disabled}
            onPress={() => (onComplete ? onComplete() : undefined)}
            style={[styles.primaryBtn, disabled ? styles.buttonDisabled : null]}
          >
            <CGText style={styles.primaryBtnText}>{actionLabel || (completed ? "Completed" : "Mark done")}</CGText>
          </Pressable>

          <Pressable
            disabled={disabled}
            onPress={() => (onReset ? onReset() : undefined)}
            style={[styles.secondaryBtn, disabled ? styles.buttonDisabled : null]}
          >
            <CGText style={styles.secondaryBtnText}>Reset</CGText>
          </Pressable>
        </Row>
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  title: { fontSize: 16, fontWeight: "800" },
  badgeText: { fontSize: 12, fontWeight: "800" },
  bodyText: { fontSize: 14, fontWeight: "600", opacity: 0.85 },

  primaryBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 14, fontWeight: "800" },

  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    opacity: 0.9,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "800" },
  buttonDisabled: { opacity: 0.55 },
});
