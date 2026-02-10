import React from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * IMPORTANT:
 * index.tsx must NOT route. AuthGate is the only routing authority.
 * This screen just provides a harmless render target for "/".
 */
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
