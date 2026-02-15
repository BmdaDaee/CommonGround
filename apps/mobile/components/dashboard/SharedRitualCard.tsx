import React from 'react';
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

const DEFAULT_RITUAL_DATA = {
  title: 'Shared Ritual',
  ritualTitle: 'Evening gratitude check-in',
  ritualNote: 'Take two minutes to share one highlight from today.',
  completeLabel: 'Mark Complete',
};

const noop = () => {};

export type SharedRitualCardProps = {
  completeLabel?: string;
  onComplete?: () => void;
  onSkip?: () => void;
  ritualNote?: string;
  ritualTitle?: string;
  title?: string;
};

export function SharedRitualCard({
  completeLabel = DEFAULT_RITUAL_DATA.completeLabel,
  onComplete = noop,
  onSkip = noop,
  ritualNote = DEFAULT_RITUAL_DATA.ritualNote,
  ritualTitle = DEFAULT_RITUAL_DATA.ritualTitle,
  title = DEFAULT_RITUAL_DATA.title,
}: SharedRitualCardProps) {
  const safeOnComplete = typeof onComplete === 'function' ? onComplete : noop;
  const safeOnSkip = typeof onSkip === 'function' ? onSkip : noop;
  const safeTitle = typeof title === 'string' ? title : DEFAULT_RITUAL_DATA.title;
  const safeRitualTitle =
    typeof ritualTitle === 'string' ? ritualTitle : DEFAULT_RITUAL_DATA.ritualTitle;
  const safeRitualNote =
    typeof ritualNote === 'string' ? ritualNote : DEFAULT_RITUAL_DATA.ritualNote;
  const safeCompleteLabel =
    typeof completeLabel === 'string' ? completeLabel : DEFAULT_RITUAL_DATA.completeLabel;

  return (
    <View style={styles.card}>
      <Stack style={styles.stack}>
        <Row style={styles.header}>
          <Text style={styles.title}>{safeTitle}</Text>
          <Pressable accessibilityRole="button" onPress={safeOnSkip} style={styles.secondaryChip}>
            <Text style={styles.secondaryChipText}>Skip</Text>
          </Pressable>
        </Row>
        <Text style={styles.ritualTitle}>{safeRitualTitle}</Text>
        <Text style={styles.ritualNote}>{safeRitualNote}</Text>
        <Divider style={styles.divider} />
        <Pressable accessibilityRole="button" onPress={safeOnComplete} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{safeCompleteLabel}</Text>
        </Pressable>
      </Stack>
    </View>
  );
}

export default SharedRitualCard;

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
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ritualNote: {
    fontSize: 14,
    opacity: 0.8,
  },
  ritualTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  secondaryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stack: {
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
