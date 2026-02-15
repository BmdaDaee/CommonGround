import { StyleSheet } from 'react-native';

import { Badge, Card, CGText, Divider, Row, Screen, Stack } from './primitives';

export type Activity = {
  id: string;
  text: string;
  timestamp: string;
};

export type RecentActivityFeedCardProps = {
  activities?: Activity[];
};

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'activity-1',
    text: 'You completed the evening gratitude check-in.',
    timestamp: 'Today, 7:18 PM',
  },
  {
    id: 'activity-2',
    text: 'Your partner shared a calm pulse update.',
    timestamp: 'Today, 11:03 AM',
  },
  {
    id: 'activity-3',
    text: 'You planned a shared walk for tomorrow.',
    timestamp: 'Yesterday, 8:42 PM',
  },
];

export function RecentActivityFeedCard({ activities = MOCK_ACTIVITIES }: RecentActivityFeedCardProps) {
  return (
    <Card>
      <Stack>
        <Row style={styles.header}>
          <CGText style={styles.title}>Recent Activity</CGText>
          <Badge label={`${activities.length} items`} />
        </Row>
        <Divider />
        <Screen>
          {activities.length === 0 ? (
            <CGText style={styles.emptyText}>No recent activity yet.</CGText>
          ) : (
            activities.map((activity, index) => (
              <Stack key={activity.id} style={styles.activityItem}>
                <CGText style={styles.activityText}>{activity.text}</CGText>
                <CGText style={styles.activityTimestamp}>{activity.timestamp}</CGText>
                {index < activities.length - 1 ? <Divider /> : null}
              </Stack>
            ))
          )}
        </Screen>
      </Stack>
    </Card>
  );
}

export default RecentActivityFeedCard;

const styles = StyleSheet.create({
  activityItem: {
    gap: 6,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityTimestamp: {
    fontSize: 12,
    opacity: 0.75,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.75,
  },
  header: {
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
