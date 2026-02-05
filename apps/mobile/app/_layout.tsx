import 'react-native-get-random-values';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function Gate() {
  const { user, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!user) {
      if (!inAuth) router.replace('/(auth)/sign-in');
      return;
    }

    const hasPair = !!profile?.activePairId;
    if (!hasPair) {
      if (!inOnboarding) router.replace('/(onboarding)/pair');
      return;
    }

    // Signed in + paired -> main app
    const inApp = segments[0] === '(app)';
    if (!inApp) router.replace('/(app)/chat');
  }, [user, loading, profile, segments]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
