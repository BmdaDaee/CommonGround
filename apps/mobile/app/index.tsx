import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, loading, pairId, pairLoading } = useAuth();

  if (loading || pairLoading) return null;

  if (!user) return <Redirect href="/(auth)/login" />;

  if (pairId) return <Redirect href="/(tabs)" />;

  return <Redirect href="/(onboarding)/pair" />;
}
