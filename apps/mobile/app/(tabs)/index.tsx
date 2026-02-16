import React from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { Screen, Stack } from "@cg/ui";
import { useAuth } from "../../context/AuthContext";
import {
  SearchBarCard,
  TodaysPulseCard,
  SharedRitualCard,
  PartnerQuickActionsCard,
  RecentActivityFeedCard,
  StatsCard,
} from "../../components/dashboard";

export default function HomeScreen() {
  const router = useRouter();
  const { pairId } = useAuth();

  const activities = [
    { id: "1", text: "Morning meditation", timestamp: "9:00 AM" },
    { id: "2", text: "Evening walk", timestamp: "7:30 PM" },
    { id: "3", text: "Shared playlist update", timestamp: "8:12 PM" },
  ];

  function goMessages() {
    if (pairId) {
      router.push("/(tabs)/chat");
      return;
    }
    router.push("/(onboarding)/pair");
  }

  return (
    <Screen scroll>
      <Stack gap={16}>
        <SearchBarCard />

        <TodaysPulseCard onSubmitMood={(mood) => Alert.alert("Pulse", `Submitted: ${mood}`)} />

        <SharedRitualCard
          onComplete={() => Alert.alert("Ritual", "Marked complete")}
          onReset={() => Alert.alert("Ritual", "Reset")}
        />

        <PartnerQuickActionsCard
          onMessage={goMessages}
          onPlan={() => Alert.alert("Quick action", "Plan")}
          onSync={() => Alert.alert("Quick action", "Sync")}
        />

        <RecentActivityFeedCard activities={activities} />

        <StatsCard daysPaired={14} />
      </Stack>
    </Screen>
  );
}
