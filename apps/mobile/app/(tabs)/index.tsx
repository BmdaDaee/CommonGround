import React, { useEffect, useRef, useState } from 'react';
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { Screen, Stack } from "@cg/ui";
import { useAuth } from "../../context/AuthContext";
import { apiGetSafe, apiPost } from "../../lib/api";
import type { MoodKey } from "../../components/dashboard/usePulseState";
import {
  SearchBarCard,
  TodaysPulseCard,
  SharedRitualCard,
  PartnerQuickActionsCard,
  RecentActivityFeedCard,
  StatsCard,
} from "../../components/dashboard";
import { useRitualState } from "../../components/dashboard/useRitualState";


type PulseSyncState = 'idle' | 'syncing' | 'success' | 'error'

export default function HomeScreen() {
  const router = useRouter();
  const { pairId } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodKey>("Neutral");
  const [syncState, setSyncState] = useState<PulseSyncState>('idle');
  const resetTimer = useRef<any>(null);

  const { completed: ritualCompleted, complete: ritualComplete, reset: ritualReset } = useRitualState();

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPulse() {
      if (!pairId) {
        setPulse(null);
        return;
      }
      const { data, error } = await apiGetSafe(`/v1/pulse?pairId=${encodeURIComponent(pairId)}`);
      if (cancelled) return;
      if (error) return;

      const p = data?.pulse ?? null;

      const m = (p?.mood as MoodKey | undefined);
      if (m) setSelectedMood(m);
    }

    loadPulse();
    return () => { cancelled = true; };
  }, [pairId]);

  async function submitMood(mood: MoodKey) {
    const trimmed = String(mood || "").trim();
    if (!trimmed) {
      Alert.alert("Pulse", "Pick a mood first.");
      return;
    }
    if (!pairId) {
      Alert.alert("Not paired", "Pair with someone before sending a pulse.");
      return;
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    setSyncState('syncing');

    const { error } = await apiPost("/v1/pulse", { pairId, mood: trimmed });
    if (error) {
      setSyncState('error');
      Alert.alert("Pulse failed", String(error?.error || "Unknown error"));
      return;
    }
    setSyncState('success');

    resetTimer.current = setTimeout(() => {
      setSyncState('idle');
    }, 1200);
  }

  const pulseLabel =
    syncState === 'syncing' ? 'Syncing…' :
    syncState === 'success' ? 'Synced ✓' :
    syncState === 'error' ? 'Retry sync' :
    'Sync pulse';

  const pulseSubtext =
    syncState === 'success' ? 'Updated just now' :
    syncState === 'error' ? 'Could not sync. Try again.' :
    undefined;

  const pulseDisabled = syncState === 'syncing' || !pairId;

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

        <TodaysPulseCard
          mood={selectedMood}
          onSelectMood={setSelectedMood}
          onSubmitMood={() => submitMood(selectedMood)}
          submitLabel={pulseLabel}
          submitSubtext={pulseSubtext}
          submitDisabled={pulseDisabled}
        />

        <SharedRitualCard
          completed={ritualCompleted}
          onComplete={() => (pairId ? ritualComplete(pairId, "daily") : Alert.alert("Not paired", "Pair with someone before completing a ritual."))}
          onReset={() => ritualReset()}
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
