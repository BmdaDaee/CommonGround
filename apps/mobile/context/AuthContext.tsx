import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { apiGet } from "@/lib/api";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  pairId: string | null;
  pairLoading: boolean;
  refreshPair: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [pairId, setPairId] = useState<string | null>(null);
  const [pairLoading, setPairLoading] = useState(false);

  const refreshingRef = useRef(false);

  async function refreshPair() {
  const baseUrl = (process.env as any).EXPO_PUBLIC_CG_API_BASE_URL as string | undefined;

  try {
    console.log("CG_REFRESH_DEBUG: refreshPair start");
    console.log("CG_REFRESH_DEBUG: API base", baseUrl);
    setPairLoading(true);

    if (!baseUrl) {
      console.log("CG_REFRESH_DEBUG: missing EXPO_PUBLIC_CG_API_BASE_URL");
      setPairId(null);
      return;
    }

    const token =
      (typeof accessToken !== "undefined" && (accessToken as any)) ||
      (session as any)?.access_token ||
      (session as any)?.accessToken ||
      null;

    if (!token) {
      console.log("CG_REFRESH_DEBUG: missing access token at refreshPair");
      setPairId(null);
      return;
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    const path = "/v1/pairs/me";
    console.log("CG_REFRESH_DEBUG: trying", path);

    const res = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(t));

    console.log("CG_REFRESH_DEBUG: /v1/pairs/me status", res.status);

    const text = await res.text().catch(() => "");
    console.log("CG_REFRESH_DEBUG: /v1/pairs/me body", text.slice(0, 300));

    if (!res.ok) {
      setPairId(null);
      return;
    }

    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    const pairId =
      data?.pair?.id ||
      data?.pair?.pair_id ||
      data?.pairId ||
      data?.activePairId ||
      data?.active_pair_id ||
      null;

    if (pairId) {
      console.log("CG_REFRESH_DEBUG: setPairId", pairId);
      setPairId(pairId);
      return;
    }

    console.log("CG_REFRESH_DEBUG: no active pair found (parsed)");
    setPairId(null);
  } catch (e) {
    console.log("CG_REFRESH_DEBUG: refreshPair error", e);
    setPairId(null);
  } finally {
    console.log("CG_REFRESH_DEBUG: pairLoading false");
    setPairLoading(false);
  }
}

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.warn("[auth] getSession error:", error.message);
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      if (!nextSession) setPairId(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setPairId(null);
      return;
    }
    refreshPair();
  }, [session?.access_token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      pairId,
      pairLoading,
      refreshPair,
      signOut: async () => {
        setPairId(null);
        await supabase.auth.signOut();
      },
    }),
    [session, loading, pairId, pairLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
