import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  gap?: number;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Row({ children, gap = 12, align, justify, wrap, style }: Props) {
  const kids = React.Children.toArray(children).filter(Boolean);
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? "wrap" : "nowrap",
        },
        style,
      ]}
    >
      {kids.map((child, i) => (
        <View key={i} style={i === 0 ? undefined : { marginLeft: gap }}>
          {child}
        </View>
      ))}
    </View>
  );
}
