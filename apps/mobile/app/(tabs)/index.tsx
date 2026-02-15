import React from "react";
import { Screen, Stack } from "@cg/ui";

import {
  SearchBarCard,
  TodaysPulseCard,
  SharedRitualCard,
  PartnerQuickActionsCard,
  RecentActivityFeedCard,
  StatsCard,
} from "../../components/dashboard";

export default function HomeScreen() {
  const activities = [
    { id: "1", text: "Morning meditation with Alex", timestamp: "9:00 AM" },
    { id: "2", text: "Evening walk with Jamie", timestamp: "7:30 PM" },
    { id: "3", text: "Shared playlist update", timestamp: "8:12 PM" },
  ];

  return (
    <Screen scroll>
      <Stack gap={16}>
        <SearchBarCard />
        <TodaysPulseCard onSubmitMood={() => {}} />
        <SharedRitualCard onComplete={() => {}} />
        <PartnerQuickActionsCard onMessage={() => {}} onPlan={() => {}} onSync={() => {}} />
        <RecentActivityFeedCard activities={activities} />
        <StatsCard daysPaired={14} />
      </Stack>
    </Screen>
  );
}
