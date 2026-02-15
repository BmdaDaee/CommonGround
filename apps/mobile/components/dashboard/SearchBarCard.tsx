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

const DEFAULT_SEARCH_DATA = {
  title: 'Search',
  placeholder: 'Search rituals, messages, or plans',
  value: '',
};

const noop = () => {};

export type SearchBarCardProps = {
  onPressSearch?: () => void;
  placeholder?: string;
  title?: string;
  value?: string;
};

export function SearchBarCard({
  onPressSearch = noop,
  placeholder = DEFAULT_SEARCH_DATA.placeholder,
  title = DEFAULT_SEARCH_DATA.title,
  value = DEFAULT_SEARCH_DATA.value,
}: SearchBarCardProps) {
  const safeOnPressSearch = typeof onPressSearch === 'function' ? onPressSearch : noop;
  const safeTitle = typeof title === 'string' ? title : DEFAULT_SEARCH_DATA.title;
  const safePlaceholder =
    typeof placeholder === 'string' ? placeholder : DEFAULT_SEARCH_DATA.placeholder;
  const safeValue = typeof value === 'string' ? value : DEFAULT_SEARCH_DATA.value;
  const displayText = safeValue.trim().length > 0 ? safeValue : safePlaceholder;

  return (
    <View style={styles.card}>
      <Stack style={styles.stack}>
        <Row style={styles.headerRow}>
          <Text style={styles.title}>{safeTitle}</Text>
        </Row>
        <Pressable accessibilityRole="button" onPress={safeOnPressSearch} style={styles.searchButton}>
          <Text
            numberOfLines={1}
            style={[styles.searchText, safeValue.trim().length === 0 && styles.placeholder]}>
            {displayText}
          </Text>
        </Pressable>
      </Stack>
    </View>
  );
}

export default SearchBarCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    width: '100%',
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: {
    opacity: 0.6,
  },
  searchButton: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  searchText: {
    fontSize: 14,
  },
  stack: {
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
