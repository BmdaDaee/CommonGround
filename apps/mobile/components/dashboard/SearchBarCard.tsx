import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { Card, CGText, Row, Stack } from './primitives';

export type SearchBarCardProps = {
  placeholder?: string;
};

const DEFAULT_PLACEHOLDER = 'Search rituals, messages, or plans';

export function SearchBarCard({ placeholder = DEFAULT_PLACEHOLDER }: SearchBarCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Card>
      <Stack>
        <CGText style={styles.title}>Search</CGText>
        <Row
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.icon,
            },
          ]}>
          <CGText numberOfLines={1} style={[styles.searchPlaceholder, { color: colors.icon }]}>
            {placeholder}
          </CGText>
        </Row>
      </Stack>
    </Card>
  );
}

export default SearchBarCard;

const styles = StyleSheet.create({
  searchInput: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    paddingHorizontal: 12,
    width: '100%',
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
