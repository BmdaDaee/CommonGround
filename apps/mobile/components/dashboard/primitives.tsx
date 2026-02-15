import * as React from 'react';
import * as UIKit from '@cg/ui';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type PrimitiveMap = {
  Badge?: React.ComponentType<any>;
  Button?: React.ComponentType<any>;
  Card?: React.ComponentType<any>;
  CGText?: React.ComponentType<any>;
  Divider?: React.ComponentType<any>;
  Row?: React.ComponentType<any>;
  Screen?: React.ComponentType<any>;
  Stack?: React.ComponentType<any>;
};

const primitives = UIKit as unknown as PrimitiveMap;

export const CARD_RADIUS = 16;

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  title?: string;
  variant?: ButtonVariant;
};

export type BadgeProps = ViewProps & {
  children?: React.ReactNode;
  label?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Card({ children, style, ...rest }: ViewProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const ResolvedCard = primitives.Card;

  if (ResolvedCard) {
    return (
      <ResolvedCard
        {...rest}
        style={[styles.cardBase, { borderColor: colors.icon, borderRadius: CARD_RADIUS }, style]}>
        {children}
      </ResolvedCard>
    );
  }

  return (
    <View
      {...rest}
      style={[styles.cardBase, { borderColor: colors.icon, borderRadius: CARD_RADIUS }, style]}>
      {children}
    </View>
  );
}

export function Button({
  children,
  disabled,
  onPress,
  style,
  textStyle,
  title,
  variant = 'secondary',
  ...rest
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const ResolvedButton = primitives.Button;
  const content = children ?? title ?? 'Action';

  if (ResolvedButton) {
    return (
      <ResolvedButton {...rest} disabled={disabled} onPress={onPress} style={style} variant={variant}>
        {content}
      </ResolvedButton>
    );
  }

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        {
          backgroundColor: variant === 'primary' ? colors.tint : colors.background,
          borderColor: colors.icon,
        },
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}>
      {typeof content === 'string' || typeof content === 'number' ? (
        <Text
          style={[
            styles.buttonText,
            { color: variant === 'primary' ? colors.background : colors.text },
            textStyle,
          ]}>
          {content}
        </Text>
      ) : (
        content
      )}
    </Pressable>
  );
}

export function CGText({ children, style, ...rest }: TextProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const ResolvedText = primitives.CGText;

  if (ResolvedText) {
    return (
      <ResolvedText {...rest} style={[styles.textBase, { color: colors.text }, style]}>
        {children}
      </ResolvedText>
    );
  }

  return (
    <Text {...rest} style={[styles.textBase, { color: colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Badge({ children, label, style, textStyle, ...rest }: BadgeProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const ResolvedBadge = primitives.Badge;
  const content = children ?? label;

  if (ResolvedBadge) {
    return (
      <ResolvedBadge {...rest} style={style}>
        {content}
      </ResolvedBadge>
    );
  }

  return (
    <View
      {...rest}
      style={[styles.badgeBase, { backgroundColor: colors.background, borderColor: colors.icon }, style]}>
      {typeof content === 'string' || typeof content === 'number' ? (
        <Text style={[styles.badgeText, { color: colors.text }, textStyle]}>{content}</Text>
      ) : (
        content
      )}
    </View>
  );
}

export function Screen({ children, style, ...rest }: ViewProps) {
  const ResolvedScreen = primitives.Screen;

  if (ResolvedScreen) {
    return (
      <ResolvedScreen {...rest} style={style}>
        {children}
      </ResolvedScreen>
    );
  }

  return (
    <View {...rest} style={[styles.screenBase, style]}>
      {children}
    </View>
  );
}

export function Stack({ children, style, ...rest }: ViewProps) {
  const ResolvedStack = primitives.Stack;

  if (ResolvedStack) {
    return (
      <ResolvedStack {...rest} style={style}>
        {children}
      </ResolvedStack>
    );
  }

  return (
    <View {...rest} style={[styles.stackBase, style]}>
      {children}
    </View>
  );
}

export function Row({ children, style, ...rest }: ViewProps) {
  const ResolvedRow = primitives.Row;

  if (ResolvedRow) {
    return (
      <ResolvedRow {...rest} style={style}>
        {children}
      </ResolvedRow>
    );
  }

  return (
    <View {...rest} style={[styles.rowBase, style]}>
      {children}
    </View>
  );
}

export function Divider({ style, ...rest }: ViewProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const ResolvedDivider = primitives.Divider;

  if (ResolvedDivider) {
    return <ResolvedDivider {...rest} style={style} />;
  }

  return <View {...rest} style={[styles.dividerBase, { backgroundColor: colors.icon }, style]} />;
}

const styles = StyleSheet.create({
  badgeBase: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonBase: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardBase: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  dividerBase: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  rowBase: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  screenBase: {
    width: '100%',
  },
  stackBase: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  textBase: {
    fontSize: 15,
  },
});
