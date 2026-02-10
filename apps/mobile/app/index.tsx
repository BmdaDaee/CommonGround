import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ensureSession } from "../lib/api";
import { getSessionPairId } from "../lib/pairing";

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const session = await ensureSession();
        const pairId = getSessionPairId(session);
        if (!mounted) return;

        if (pairId) {
          router.replace("/(app)/chat");
          return;
        }

        router.replace("/(onboarding)/pair");
      } catch (err: unknown) {
        if (!mounted) return;
        const message =
          typeof err === "object" &&
          err &&
          "message" in err &&
          typeof (err as { message?: string }).message === "string"
            ? (err as { message: string }).message
            : "Could not load your session. Please try again.";
        setError(message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [attempt, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, gap: 10 }}>
        <ActivityIndicator />
        <Text style={{ color: "#4B5563", textAlign: "center" }}>Checking your pairing status…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, gap: 14 }}>
      <Text style={{ color: "#B91C1C", textAlign: "center" }}>{error ?? "Unable to continue right now."}</Text>
      <Pressable
        onPress={() => setAttempt((value) => value + 1)}
        style={{
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "#111827",
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Text style={{ color: "#111827", fontWeight: "700" }}>Try Again</Text>
      </Pressable>
    </View>
  );
}
