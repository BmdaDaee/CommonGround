import { Stack } from "expo-router";
import { AuthGate } from "../lib/authGate";

export default function RootLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
