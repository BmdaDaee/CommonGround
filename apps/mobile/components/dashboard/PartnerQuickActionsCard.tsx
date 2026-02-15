import React from 'react';
import * as UIKit from '@cg/ui';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type PrimitiveProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const primitives = UIKit as unknown as {
  Row?: React.ComponentType<PrimitiveProps>;
  Stack?: React.ComponentType<PrimitiveProps>;
};

const Row = primitives.Row ?? View;
const Stack = primitives.Stack ?? View;

const CARD_RADIUS = 16;

export type QuickAction = {
  id: string;
  label: string;
};

const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'message', label: 'Message' },
  { id: 'plan', label: 'Plan Date' },
  { id: 'sync', label: 'Sync Check-In' },
];

const noop = (_action: QuickAction) => {};

export type PartnerQuickActionsCardProps = {
  actions?: QuickAction[];
  onPressAction?: (action: QuickAction) => void;
  title?: string;
};

export function PartnerQuickActionsCard({
  actions = DEFAULT_ACTIONS,
  onPressAction = noop,
  title = 'Partner Quick Actions',
}: PartnerQuickActionsCardProps) {
  const safeOnPressAction = typeof onPressAction === 'function' ? onPressAction : noop;
  const safeTitle = typeof title === 'string' ? title : 'Partner Quick Actions';
  const candidateActions = Array.isArray(actions) ? actions : [];
  const safeActions = candidateActions.length > 0 ? candidateActions : DEFAULT_ACTIONS;

  return (
    <View style={styles.card}>
      <Stack style={styles.stack}>
        <Text style={styles.title}>{safeTitle}</Text>
        <Row style={styles.actionRow}>
          {safeActions.map((action) => (
            <Pressable
              accessibilityRole="button"
              key={action.id}
              onPress={() => safeOnPressAction(action)}
              style={styles.actionChip}>
              <Text numberOfLines={1} style={styles.actionText}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </Row>
      </Stack>
    </View>
  );
}

export default PartnerQuickActionsCard;

const styles = StyleSheet.create({
  actionChip: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 96,
    paddingHorizontal: 10,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    width: '100%',
  },
  stack: {
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
