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
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    try {
      setPairLoading(true);

      if (!session?.access_token) {
        setPairId(null);
        return;
      }

      const data: any = await apiGet("/v1/pairs/me");
      const pid =
        data?.pair?.id ||
        data?.pair?.pair_id ||
        data?.pairId ||
        data?.activePairId ||
        data?.active_pair_id ||
        null;

      setPairId(pid);
    } catch {
      setPairId(null);
    } finally {
      setPairLoading(false);
      refreshingRef.current = false;
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
