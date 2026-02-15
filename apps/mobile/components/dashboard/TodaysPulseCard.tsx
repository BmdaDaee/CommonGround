import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { Badge, Button, Card, CGText, Divider, Stack } from './primitives';

const MOOD_OPTIONS = ['Happy', 'Calm', 'Neutral', 'Anxious', 'Sad'] as const;

type Mood = (typeof MOOD_OPTIONS)[number];

export type TodaysPulseCardProps = {
  initialMood?: Mood;
  onSubmitMood?: (mood: string) => void;
};

const noopSubmitMood = (_mood: string) => {};

export function TodaysPulseCard({
  initialMood = 'Calm',
  onSubmitMood = noopSubmitMood,
}: TodaysPulseCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedMood, setSelectedMood] = useState<Mood>(initialMood);

  return (
    <Card>
      <Stack>
        <CGText style={styles.title}>Today&apos;s Pulse</CGText>
        <Badge label={`Selected: ${selectedMood}`} />
        <View style={styles.moodGrid}>
          {MOOD_OPTIONS.map((mood) => (
            <Button
              key={mood}
              onPress={() => setSelectedMood(mood)}
              style={[styles.moodButton, mood === selectedMood && styles.selectedMoodButton]}
              title={mood}
              variant={mood === selectedMood ? 'primary' : 'secondary'}
            />
          ))}
        </View>
        <Divider style={{ backgroundColor: colors.icon }} />
        <Button onPress={() => onSubmitMood(selectedMood)} title="Submit Mood" variant="primary" />
      </Stack>
    </Card>
  );
}

export default TodaysPulseCard;

const styles = StyleSheet.create({
  moodButton: {
    flexGrow: 1,
    minWidth: 104,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedMoodButton: {
    borderWidth: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
