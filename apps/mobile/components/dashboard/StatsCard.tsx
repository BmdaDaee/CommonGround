import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { Badge, Card, CGText, Divider, Row, Stack } from './primitives';

export type StatsCardProps = {
  daysPaired?: number;
  sparklineValues?: number[];
};

const MOCK_SPARKLINE_VALUES = [5, 7, 6, 8, 9, 7, 10];

export function StatsCard({
  daysPaired = 128,
  sparklineValues = MOCK_SPARKLINE_VALUES,
}: StatsCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const safeSparklineValues = sparklineValues.length > 0 ? sparklineValues : MOCK_SPARKLINE_VALUES;
  const maxValue = Math.max(...safeSparklineValues, 1);

  return (
    <Card>
      <Stack>
        <Row style={styles.header}>
          <CGText style={styles.title}>Stats</CGText>
          <Badge label="Connection" />
        </Row>
        <Row style={styles.daysRow}>
          <CGText style={styles.daysValue}>{daysPaired}</CGText>
          <CGText style={styles.daysLabel}>days paired</CGText>
        </Row>
        <Divider />
        <Row style={styles.sparklineRow}>
          {safeSparklineValues.map((value, index) => {
            const normalizedHeight = 10 + Math.round((value / maxValue) * 36);
            const isCurrent = index === safeSparklineValues.length - 1;

            return (
              <View
                key={`spark-${index}-${value}`}
                style={[
                  styles.sparkBar,
                  {
                    backgroundColor: isCurrent ? colors.tint : colors.icon,
                    height: normalizedHeight,
                    opacity: isCurrent ? 1 : 0.5,
                  },
                ]}
              />
            );
          })}
        </Row>
      </Stack>
    </Card>
  );
}

export default StatsCard;

const styles = StyleSheet.create({
  daysLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  daysRow: {
    alignItems: 'baseline',
  },
  daysValue: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 38,
  },
  header: {
    justifyContent: 'space-between',
  },
  sparkBar: {
    borderRadius: 4,
    flex: 1,
    minHeight: 10,
  },
  sparklineRow: {
    alignItems: 'flex-end',
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
