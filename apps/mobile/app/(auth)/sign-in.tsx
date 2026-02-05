import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const e = email.trim();
      if (!e || !password) throw new Error('Enter email + password');

      if (mode === 'signUp') {
        await createUserWithEmailAndPassword(firebaseAuth, e, password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, e, password);
      }
    } catch (err: any) {
      setError(err?.message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CommonGround</Text>
      <Text style={styles.subtitle}>Phase 1: Foundation</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="you@domain.com"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="••••••••"
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable onPress={submit} style={styles.primary} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text style={styles.primaryText}>{mode === 'signUp' ? 'Create account' : 'Sign in'}</Text>}
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')} style={styles.link}>
          <Text style={styles.linkText}>
            {mode === 'signIn' ? "Need an account? Sign up" : 'Have an account? Sign in'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.footnote}>Use email/password for Phase 1. Social login can come later.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 14, opacity: 0.75 },
  card: { marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#00000022', gap: 10 },
  label: { fontSize: 12, opacity: 0.7 },
  input: { borderWidth: 1, borderColor: '#00000022', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  error: { color: '#b00020' },
  primary: { borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#00000022' },
  primaryText: { fontSize: 16, fontWeight: '700' },
  link: { paddingVertical: 8, alignItems: 'center' },
  linkText: { textDecorationLine: 'underline' },
  footnote: { marginTop: 16, fontSize: 12, opacity: 0.6 },
});
