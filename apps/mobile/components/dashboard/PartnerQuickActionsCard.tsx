import { StyleSheet } from 'react-native';

import { Button, Card, CGText, Row, Stack } from './primitives';

export type PartnerQuickActionsCardProps = {
  onMessage?: () => void;
  onPlan?: () => void;
  onSync?: () => void;
};

const noopAction = () => {};

export function PartnerQuickActionsCard({
  onMessage = noopAction,
  onPlan = noopAction,
  onSync = noopAction,
}: PartnerQuickActionsCardProps) {
  return (
    <Card>
      <Stack>
        <CGText style={styles.title}>Partner Quick Actions</CGText>
        <Row style={styles.actionsRow}>
          <Button onPress={onMessage} style={styles.actionButton} title="Message" />
          <Button onPress={onPlan} style={styles.actionButton} title="Plan" />
          <Button onPress={onSync} style={styles.actionButton} title="Sync" />
        </Row>
      </Stack>
    </Card>
  );
}

export default PartnerQuickActionsCard;

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actionsRow: {
    alignItems: 'stretch',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
