import React from "react";
import {
  Text,
  View,
  Pressable,
  type TextProps,
  type ViewProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

// Prefer the real primitives from @cg/ui (what we actually want)
export { Screen, Stack, Row, Divider } from "@cg/ui";

/**
 * Minimal extras used by your dashboard cards.
 * No hex colors. No backend dependency. Safe defaults.
 */

export function CGText({
  style,
  ...props
}: TextProps & { style?: StyleProp<TextStyle> }) {
  return <Text {...props} style={style} />;
}

export function Badge({
  children,
  style,
  ...props
}: ViewProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      {...props}
      style={[
        {
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 4,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  style,
}: {
  title: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress ?? (() => {})}
      style={[
        {
          borderWidth: 1,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          alignItems: "center",
        },
        style,
      ]}
    >
      <Text style={{ fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}

