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

export type StatsMetric = {
  id: string;
  label: string;
  value: string;
};

const DEFAULT_STATS_DATA = {
  title: 'Stats',
  trendValues: [4, 6, 5, 7, 8, 7, 9],
};

const DEFAULT_METRICS: StatsMetric[] = [
  { id: 'days-paired', label: 'Days paired', value: '128' },
  { id: 'shared-rituals', label: 'Shared rituals', value: '42' },
  { id: 'pulse-streak', label: 'Pulse streak', value: '11' },
];

const noop = (_metric: StatsMetric) => {};

export type StatsCardProps = {
  metrics?: StatsMetric[];
  onPressMetric?: (metric: StatsMetric) => void;
  title?: string;
  trendValues?: number[];
};

export function StatsCard({
  metrics = DEFAULT_METRICS,
  onPressMetric = noop,
  title = DEFAULT_STATS_DATA.title,
  trendValues = DEFAULT_STATS_DATA.trendValues,
}: StatsCardProps) {
  const safeOnPressMetric = typeof onPressMetric === 'function' ? onPressMetric : noop;
  const safeTitle = typeof title === 'string' ? title : DEFAULT_STATS_DATA.title;
  const candidateMetrics = Array.isArray(metrics) ? metrics : [];
  const candidateTrendValues = Array.isArray(trendValues) ? trendValues : [];
  const safeMetrics = candidateMetrics.length > 0 ? candidateMetrics : DEFAULT_METRICS;
  const safeTrendValues =
    candidateTrendValues.length > 0 ? candidateTrendValues : DEFAULT_STATS_DATA.trendValues;
  const maxTrend = Math.max(...safeTrendValues, 1);

  return (
    <View style={styles.card}>
      <Stack style={styles.stack}>
        <Text style={styles.title}>{safeTitle}</Text>
        <Row style={styles.metricsRow}>
          {safeMetrics.map((metric) => (
            <Pressable
              accessibilityRole="button"
              key={metric.id}
              onPress={() => safeOnPressMetric(metric)}
              style={styles.metricItem}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </Pressable>
          ))}
        </Row>
        <Divider style={styles.divider} />
        <Row style={styles.trendRow}>
          {safeTrendValues.map((value, index) => {
            const height = 10 + Math.round((value / maxTrend) * 26);
            const isLatest = index === safeTrendValues.length - 1;

            return <View key={`trend-${index}-${value}`} style={[styles.trendBar, { height, opacity: isLatest ? 1 : 0.55 }]} />;
          })}
        </Row>
      </Stack>
    </View>
  );
}

export default StatsCard;

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
  metricItem: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricsRow: {
    alignItems: 'stretch',
    gap: 8,
  },
  stack: {
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  trendBar: {
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 10,
  },
  trendRow: {
    alignItems: 'flex-end',
    gap: 6,
  },
});
