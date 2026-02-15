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
  Screen?: React.ComponentType<PrimitiveProps>;
  Stack?: React.ComponentType<PrimitiveProps>;
};

const Divider = primitives.Divider ?? View;
const Row = primitives.Row ?? View;
const Screen = primitives.Screen ?? View;
const Stack = primitives.Stack ?? View;

const CARD_RADIUS = 16;

export type ActivityItem = {
  id: string;
  text: string;
  timestamp: string;
};

const DEFAULT_FEED_DATA = {
  title: 'Recent Activity',
  emptyLabel: 'No recent activity yet.',
};

const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: 'activity-1', text: 'You completed the evening gratitude check-in.', timestamp: 'Today, 7:18 PM' },
  { id: 'activity-2', text: 'Your partner shared a calm pulse update.', timestamp: 'Today, 11:03 AM' },
  { id: 'activity-3', text: 'You planned a shared walk for tomorrow.', timestamp: 'Yesterday, 8:42 PM' },
];

const noop = (_activity: ActivityItem) => {};

export type RecentActivityFeedCardProps = {
  activities?: ActivityItem[];
  emptyLabel?: string;
  onPressActivity?: (activity: ActivityItem) => void;
  title?: string;
};

export function RecentActivityFeedCard({
  activities = MOCK_ACTIVITIES,
  emptyLabel = DEFAULT_FEED_DATA.emptyLabel,
  onPressActivity = noop,
  title = DEFAULT_FEED_DATA.title,
}: RecentActivityFeedCardProps) {
  const safeOnPressActivity =
    typeof onPressActivity === 'function' ? onPressActivity : noop;
  const safeTitle = typeof title === 'string' ? title : DEFAULT_FEED_DATA.title;
  const safeEmptyLabel =
    typeof emptyLabel === 'string' ? emptyLabel : DEFAULT_FEED_DATA.emptyLabel;
  const candidateActivities = Array.isArray(activities) ? activities : [];
  const safeActivities = candidateActivities.length > 0 ? candidateActivities : [];

  return (
    <View style={styles.card}>
      <Stack style={styles.stack}>
        <Row style={styles.header}>
          <Text style={styles.title}>{safeTitle}</Text>
          <Text style={styles.countLabel}>{safeActivities.length} items</Text>
        </Row>
        <Divider style={styles.divider} />
        <Screen style={styles.feedWrap}>
          {safeActivities.length === 0 ? (
            <Text style={styles.emptyText}>{safeEmptyLabel}</Text>
          ) : (
            safeActivities.map((activity, index) => (
              <View key={activity.id}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => safeOnPressActivity(activity)}
                  style={styles.activityPressable}>
                  <Text style={styles.activityText}>{activity.text}</Text>
                  <Text style={styles.activityTime}>{activity.timestamp}</Text>
                </Pressable>
                {index < safeActivities.length - 1 ? <Divider style={styles.divider} /> : null}
              </View>
            ))
          )}
        </Screen>
      </Stack>
    </View>
  );
}

export default RecentActivityFeedCard;

const styles = StyleSheet.create({
  activityPressable: {
    gap: 4,
    paddingVertical: 8,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    width: '100%',
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    paddingVertical: 8,
  },
  feedWrap: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stack: {
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
