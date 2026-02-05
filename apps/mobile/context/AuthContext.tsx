import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';
import { ensureSession } from '@/lib/api';

type AuthState = {
  user: User | null;
  loading: boolean;
  profile: any | null;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    if (!firebaseAuth.currentUser) {
      setProfile(null);
      return;
    }
    const session = await ensureSession();
    setProfile(session.user || null);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (u) => {
      setUser(u);
      setLoading(true);
      try {
        if (u) await refreshProfile();
        else setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const value = useMemo(() => ({ user, loading, profile, refreshProfile }), [user, loading, profile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
