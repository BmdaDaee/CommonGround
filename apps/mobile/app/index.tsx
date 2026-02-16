import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, pairId } = useAuth();

  if (!user) return <Redirect href="/(auth)/login" />;

  if (!pairId) return <Redirect href="/(onboarding)/pair" />;

  return <Redirect href="/(tabs)" />;
}
