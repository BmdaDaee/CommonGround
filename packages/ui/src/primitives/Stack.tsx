import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  gap?: number;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  style?: StyleProp<ViewStyle>;
};

export function Stack({ children, gap = 12, align, justify, style }: Props) {
  const kids = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ flexDirection: "column", alignItems: align, justifyContent: justify }, style]}>
      {kids.map((child, i) => (
        <View key={i} style={i === 0 ? undefined : { marginTop: gap }}>
          {child}
        </View>
      ))}
    </View>
  );
}
