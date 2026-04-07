import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pair, setPair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.ensureSession();
      setProfile(data.user || null);
      
      // Also fetch pair
      const pairRes = await api.getMyPair();
      setPair(pairRes.data.pair || null);
    } catch (e) {
      console.error('Failed to refresh profile:', e);
      setProfile(null);
      setPair(null);
    }
  }, []);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAccessToken(session?.access_token || null);
      
      if (session?.user) {
        refreshProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setAccessToken(session?.access_token || null);
        
        if (session?.user) {
          await refreshProfile();
        } else {
          setProfile(null);
          setPair(null);
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, [refreshProfile]);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = useMemo(() => ({
    user,
    profile,
    pair,
    loading,
    accessToken,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    setPair,
  }), [user, profile, pair, loading, accessToken, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
