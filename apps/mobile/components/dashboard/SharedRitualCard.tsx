import { StyleSheet } from 'react-native';

import { Badge, Button, Card, CGText, Divider, Row, Stack } from './primitives';

export type SharedRitualCardProps = {
  onComplete?: () => void;
  ritualTitle?: string;
};

const noopComplete = () => {};

export function SharedRitualCard({
  onComplete = noopComplete,
  ritualTitle = 'Evening gratitude check-in',
}: SharedRitualCardProps) {
  return (
    <Card>
      <Stack>
        <Row style={styles.header}>
          <CGText style={styles.title}>Shared Ritual</CGText>
          <Badge label="Today" />
        </Row>
        <CGText style={styles.ritualTitle}>{ritualTitle}</CGText>
        <Divider />
        <Button onPress={onComplete} title="Complete" variant="primary" />
      </Stack>
    </Card>
  );
}

export default SharedRitualCard;

const styles = StyleSheet.create({
  header: {
    justifyContent: 'space-between',
  },
  ritualTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
