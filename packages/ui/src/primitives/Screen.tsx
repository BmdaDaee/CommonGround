import React from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  pad?: number;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll, pad = 20, style }: Props) {
  if (scroll) {
    return <ScrollView contentContainerStyle={[{ padding: pad }, style]}>{children}</ScrollView>;
  }
  return <View style={[{ padding: pad }, style]}>{children}</View>;
}
