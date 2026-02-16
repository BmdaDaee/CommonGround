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
};

const DEFAULT_MOODS: MoodKey[] = ["Happy", "Calm", "Neutral", "Anxious", "Tired"];

export default function TodaysPulseCard({
  title = "Today’s Pulse",
  mood = "Neutral",
  moods = DEFAULT_MOODS,
  onSelectMood,
  onSubmitMood,
}: TodaysPulseCardProps) {
  const safeMoods = useMemo(() => (Array.isArray(moods) && moods.length ? moods : DEFAULT_MOODS), [moods]);

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

        <Pressable
          onPress={() => (onSubmitMood ? onSubmitMood() : undefined)}
          style={styles.primaryBtn}
        >
          <CGText style={styles.primaryBtnText}>Sync pulse</CGText>
        </Pressable>
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
  primaryBtnText: { fontSize: 14, fontWeight: "800" },
});
