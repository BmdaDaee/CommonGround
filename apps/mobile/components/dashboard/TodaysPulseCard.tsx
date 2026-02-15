import React, { useMemo, useState } from 'react';
import * as UIKit from '@cg/ui';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type PrimitiveProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const primitives = UIKit as unknown as {
  Divider?: React.ComponentType<PrimitiveProps>;
  Row?: React.ComponentType<PrimitiveProps>;
  Stack?: React.ComponentType<PrimitiveProps>;
};

const Divider = primitives.Divider ?? View;
const Row = primitives.Row ?? View;
const Stack = primitives.Stack ?? View;

const CARD_RADIUS = 16;

const DEFAULT_PULSE_DATA = {
  title: "Today's Pulse",
  moods: ['Happy', 'Calm', 'Neutral', 'Anxious', 'Tired'],
  selectedMood: 'Calm',
  submitLabel: 'Share Pulse',
};

const noopSelect = (_mood: string) => {};
const noopSubmit = (_mood: string) => {};

export type TodaysPulseCardProps = {
  moods?: string[];
  onSelectMood?: (mood: string) => void;
  onSubmitMood?: (mood: string) => void;
  selectedMood?: string;
  submitLabel?: string;
  title?: string;
};

export function TodaysPulseCard({
  moods = DEFAULT_PULSE_DATA.moods,
  onSelectMood = noopSelect,
  onSubmitMood = noopSubmit,
  selectedMood = DEFAULT_PULSE_DATA.selectedMood,
  submitLabel = DEFAULT_PULSE_DATA.submitLabel,
  title = DEFAULT_PULSE_DATA.title,
}: TodaysPulseCardProps) {
  const safeOnSelectMood = typeof onSelectMood === 'function' ? onSelectMood : noopSelect;
  const safeOnSubmitMood = typeof onSubmitMood === 'function' ? onSubmitMood : noopSubmit;
  const safeTitle = typeof title === 'string' ? title : DEFAULT_PULSE_DATA.title;
  const safeSubmitLabel =
    typeof submitLabel === 'string' ? submitLabel : DEFAULT_PULSE_DATA.submitLabel;
  const safeSelectedMood =
    typeof selectedMood === 'string' ? selectedMood : DEFAULT_PULSE_DATA.selectedMood;
  const safeMoods = useMemo(() => {
    const candidateMoods = Array.isArray(moods) ? moods : [];
    return candidateMoods.length > 0 ? candidateMoods : DEFAULT_PULSE_DATA.moods;
  }, [moods]);
  const initialMood = safeMoods.includes(safeSelectedMood) ? safeSelectedMood : safeMoods[0];
  const [activeMood, setActiveMood] = useState(initialMood);

  const handleMoodPress = (mood: string) => {
    setActiveMood(mood);
    safeOnSelectMood(mood);
  };

  return (
    <View style={styles.card}>
      <Stack style={styles.stack}>
        <Text style={styles.title}>{safeTitle}</Text>
        <Row style={styles.moodRow}>
          {safeMoods.map((mood) => {
            const isActive = mood === activeMood;

            return (
              <Pressable
                accessibilityRole="button"
                key={mood}
                onPress={() => handleMoodPress(mood)}
                style={[styles.moodButton, isActive && styles.moodButtonActive]}>
                <Text style={[styles.moodText, isActive && styles.moodTextActive]}>{mood}</Text>
              </Pressable>
            );
          })}
        </Row>
        <Divider style={styles.divider} />
        <Pressable
          accessibilityRole="button"
          onPress={() => safeOnSubmitMood(activeMood)}
          style={styles.submitButton}>
          <Text style={styles.submitText}>{safeSubmitLabel}</Text>
        </Pressable>
      </Stack>
    </View>
  );
}

export default TodaysPulseCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    width: '100%',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  moodButton: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moodButtonActive: {
    borderWidth: 2,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodText: {
    fontSize: 13,
    fontWeight: '500',
  },
  moodTextActive: {
    fontWeight: '700',
  },
  stack: {
    gap: 12,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
