import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  vertical?: boolean;
  opacity?: number;
  inset?: number;
  style?: StyleProp<ViewStyle>;
};

export function Divider({ vertical, opacity = 0.15, inset = 0, style }: Props) {
  return (
    <View
      style={[
        vertical
          ? { width: 1, alignSelf: "stretch", marginVertical: inset }
          : { height: 1, alignSelf: "stretch", marginHorizontal: inset },
        { opacity },
        style,
      ]}
    />
  );
}
