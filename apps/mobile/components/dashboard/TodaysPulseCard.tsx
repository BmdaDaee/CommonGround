import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Badge, CGText, Divider, Row, Stack } from "./primitives";
import type { MoodKey } from "./usePulseState";

export type TodaysPulseCardProps = {
  title?: string;
  mood?: MoodKey;
  moods?: MoodKey[];
  onSelectMood?: (mood: MoodKey) => void;
  onSubmitMood?: () => void;

  submitLabel?: string;
  submitSubtext?: string;
  submitDisabled?: boolean;
};

const DEFAULT_MOODS: MoodKey[] = ["Happy", "Calm", "Neutral", "Anxious", "Tired"];

export default function TodaysPulseCard({
  title = "Today’s Pulse",
  mood = "Neutral",
  moods = DEFAULT_MOODS,
  onSelectMood,
  onSubmitMood,
  submitLabel = "Sync pulse",
  submitSubtext,
  submitDisabled = false,
}: TodaysPulseCardProps) {
  const safeMoods = useMemo(
    () => (Array.isArray(moods) && moods.length ? moods : DEFAULT_MOODS),
    [moods]
  );

  return (
    <View style={styles.card}>
      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <CGText style={styles.title}>{title}</CGText>
          <Badge>
            <CGText style={styles.badgeText}>{mood}</CGText>
          </Badge>
        </Row>

        <Divider opacity={0.15} />

        <Row gap={10} wrap>
          {safeMoods.map((m) => {
            const active = m === mood;
            return (
              <Pressable
                key={m}
                onPress={() => (onSelectMood ? onSelectMood(m) : undefined)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <CGText style={styles.chipText}>{m}</CGText>
              </Pressable>
            );
          })}
        </Row>

        <Stack gap={6}>
          <Pressable
            disabled={submitDisabled}
            onPress={() => (onSubmitMood ? onSubmitMood() : undefined)}
            style={[
              styles.primaryBtn,
              submitDisabled ? styles.primaryBtnDisabled : null,
            ]}
          >
            <CGText style={styles.primaryBtnText}>{submitLabel}</CGText>
          </Pressable>

          {submitSubtext ? (
            <CGText style={styles.subtext}>{submitSubtext}</CGText>
          ) : null}
        </Stack>
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

  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    opacity: 0.85,
  },
  chipText: { fontSize: 13, fontWeight: "700" },

  primaryBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: { fontSize: 14, fontWeight: "800" },

  subtext: {
    fontSize: 12,
    opacity: 0.7,
  },
});
