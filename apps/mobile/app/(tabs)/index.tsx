import React, { useEffect, useMemo, useState } from 'react';
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

type PairingStatus = 'unknown' | 'none' | 'active' | 'inactive' | 'error'

function usePairingStatus() {
  const baseUrl = (process.env as any).EXPO_PUBLIC_CG_API_BASE_URL as string | undefined
  const [status, setStatus] = useState<PairingStatus>('unknown')
  const [pair, setPair] = useState<any>(null)

  const endpoints = useMemo(() => ([
    '/api/pairing/active',
    '/api/pairs/active',
    '/api/pair/active',
    '/api/pairing',
    '/api/pairs/me'
  ]), [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!baseUrl) {
        setStatus('error')
        return
      }

      for (const path of endpoints) {
        try {
          const res = await fetch(`${baseUrl}${path}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!res.ok) continue

          const data = await res.json().catch(() => ({} as any))
          const raw = String(data?.status ?? data?.state ?? data?.pair?.status ?? data?.pair?.state ?? '').toUpperCase()
          const isActive = raw === 'ACTIVE' || data?.active === true || data?.pair?.active === true

          if (cancelled) return
          setPair(data)
          setStatus(isActive ? 'active' : (raw ? 'inactive' : 'none'))
          return
        } catch {
          continue
        }
      }

      if (cancelled) return
      setStatus('none')
    }

    run()
    return () => { cancelled = true }
  }, [baseUrl, endpoints])

  return { status, pair }
}


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
