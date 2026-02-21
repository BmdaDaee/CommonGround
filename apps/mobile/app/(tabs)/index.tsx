import React, { useEffect, useRef, useState } from 'react';
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { Screen, Stack } from "@cg/ui";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { apiGetSafe, apiPost, normalizeApiErrorMessage } from "../../lib/api";
import type { MoodKey } from "../../components/dashboard/usePulseState";
import {
  SearchBarCard,
  TodaysPulseCard,
  SharedRitualCard,
  PartnerQuickActionsCard,
  RecentActivityFeedCard,
  StatsCard,
  PartnerCard,
} from "../../components/dashboard";
import { useRitualState } from "../../components/dashboard/useRitualState";

type PulseSyncState = 'idle' | 'syncing' | 'success' | 'error';

function formatRelativeTime(iso?: string | null): string | null {
  const raw = String(iso || "").trim();
  if (!raw) return null;

  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return null;

  const diffMs = Date.now() - t;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { pairId } = useAuth();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [selectedMood, setSelectedMood] = useState<MoodKey>("Neutral");
  const [syncState, setSyncState] = useState<PulseSyncState>('idle');
  const [pulseUpdatedAt, setPulseUpdatedAt] = useState<string | null>(null);
  const [pulseUserId, setPulseUserId] = useState<string | null>(null);

  const resetTimer = useRef<any>(null);

  const [pairStatus, setPairStatus] = useState<"NOT_PAIRED" | "WAITING" | "CONNECTED">("NOT_PAIRED");
  const [partnerId, setPartnerId] = useState<string | null>(null);

  const {
    completed: ritualCompleted,
    status: ritualStatus,
    complete: ritualComplete,
    reset: ritualReset,
    refresh: ritualRefresh,
  } = useRitualState();

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  // Current user id (for "Updated by You vs Partner")
  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;
      if (error) return;
      setCurrentUserId(data?.user?.id ?? null);
    }
    loadMe();
    return () => { cancelled = true; };
  }, []);

  // Load pair info
  useEffect(() => {
    let cancelled = false;

    async function loadPair() {
      if (!pairId) {
        setPairStatus("NOT_PAIRED");
        setPartnerId(null);
        return;
      }

      const { data, error } = await apiGetSafe("/v1/pairs/me");
      if (cancelled || error) return;

      const pair = data?.pair;
      if (!pair) {
        setPairStatus("NOT_PAIRED");
        setPartnerId(null);
        return;
      }

      const activeMembers = (pair.members || []).filter((m: any) => !m.left_at);

      if (activeMembers.length < 2) {
        setPairStatus("WAITING");
        setPartnerId(null);
        return;
      }

      const other = activeMembers.find((m: any) => m.user_id && m.user_id !== currentUserId);
      setPairStatus("CONNECTED");
      setPartnerId(other?.user_id || null);
    }

    loadPair();
    return () => { cancelled = true; };
  }, [pairId, currentUserId]);

  // Load pulse
  useEffect(() => {
    let cancelled = false;

    async function loadPulse() {
      if (!pairId) {
        setSelectedMood("Neutral");
        setPulseUpdatedAt(null);
        setPulseUserId(null);
        return;
      }

      const { data, error } = await apiGetSafe(`/v1/pulse?pairId=${encodeURIComponent(pairId)}`);
      if (cancelled || error) return;

      const p = data?.pulse ?? null;

      const m = (p?.mood as MoodKey | undefined);
      if (m) setSelectedMood(m);

      const updated =
        (typeof p?.updatedAt === "string" && p.updatedAt) ||
        (typeof p?.updated_at === "string" && p.updated_at) ||
        (typeof p?.updated_at_iso === "string" && p.updated_at_iso) ||
        null;

      setPulseUpdatedAt(updated);

      const who =
        (typeof p?.userId === "string" && p.userId) ||
        (typeof p?.user_id === "string" && p.user_id) ||
        null;

      setPulseUserId(who);
    }

    loadPulse();
    return () => { cancelled = true; };
  }, [pairId]);

  useEffect(() => {
    if (!pairId) return;
    ritualRefresh(pairId, "daily");
  }, [pairId, ritualRefresh]);

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

    try {
      await apiPost("/v1/pulse", { pairId, mood: trimmed });
      setPulseUpdatedAt(new Date().toISOString());
      setPulseUserId(currentUserId);
      setSyncState('success');
    } catch (e: any) {
      setSyncState('error');
      Alert.alert("Pulse failed", normalizeApiErrorMessage(e?.message ? String(e.message) : "Unknown error"));
      return;
    }

    resetTimer.current = setTimeout(() => {
      setSyncState('idle');
    }, 1200);
  }

  const pulseLabel =
    syncState === 'syncing' ? 'Syncing…' :
    syncState === 'success' ? 'Synced ✓' :
    syncState === 'error' ? 'Retry sync' :
    'Sync pulse';

  const rel = formatRelativeTime(pulseUpdatedAt);

  const pulseSubtext =
    syncState === 'success' ? 'Updated just now' :
    syncState === 'syncing' ? 'Sending…' :
    syncState === 'error' ? 'Could not sync. Try again.' :
    rel ? `Last update ${rel}` :
    pairId ? 'No pulse yet today' :
    'Pair to start';

  const pulseDisabled = syncState === 'syncing' || !pairId;

  const ritualSaving = ritualStatus === "saving";
  const ritualActionLabel =
    ritualSaving ? "Saving…" :
    ritualCompleted ? "Completed ✓" :
    undefined;

  function goMessages() {
    if (pairId) {
      router.push("/(tabs)/chat");
      return;
    }
    router.push("/(onboarding)/pair");
  }

  function onCompleteRitual() {
    if (!pairId) {
      Alert.alert("Not paired", "Pair with someone before completing a ritual.");
      return;
    }
    if (ritualSaving || ritualCompleted) return;
    ritualComplete(pairId, "daily");
  }

  return (
    <Screen scroll>
      <Stack gap={16}>
        <SearchBarCard />

        <PartnerCard
          paired={pairStatus !== "NOT_PAIRED"}
          status={pairStatus}
          partnerId={partnerId}
          onPairNow={() => router.push("/(onboarding)/pair")}
          pulseMood={selectedMood}
          pulseUpdatedAt={pulseUpdatedAt}
          pulseUserId={pulseUserId}
          currentUserId={currentUserId}
        />

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
          actionLabel={ritualActionLabel}
          completeDisabled={ritualSaving || ritualCompleted || !pairId}
          onComplete={onCompleteRitual}
          onReset={() => ritualReset()}
        />

        <PartnerQuickActionsCard
          onMessage={goMessages}
          onPlan={() => Alert.alert("Quick action", "Plan")}
          onSync={() => Alert.alert("Quick action", "Sync")}
        />

        <RecentActivityFeedCard activities={[]} />
        <StatsCard daysPaired={14} />
      </Stack>
    </Screen>
  );
}
