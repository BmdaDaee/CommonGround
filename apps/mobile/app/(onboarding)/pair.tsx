import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function PairScreen() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  async function create() {
    setLoading(true);
    try {
      const res = await api.post('/v1/pairs');
      setCreatedCode(res.data.code);
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Create failed', e?.response?.data?.error || e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function join() {
    setLoading(true);
    try {
      const res = await api.post('/v1/pairs/join', { code: code.trim().toUpperCase() });
      if (res.data?.pairId) {
        await refreshProfile();
      }
    } catch (e: any) {
      Alert.alert('Join failed', e?.response?.data?.error || e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pair up</Text>
      <Text style={styles.subtitle}>Create a pair code or join your partner’s.</Text>

      <View style={styles.card}>
        <Pressable onPress={create} style={styles.primary} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text style={styles.primaryText}>Create pair</Text>}
        </Pressable>

        {!!createdCode && (
          <View style={styles.codeBox}>
            <Text style={styles.label}>Share this code with your partner:</Text>
            <Text style={styles.code}>{createdCode}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.label}>Join with code</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="AB12CD"
          style={styles.input}
        />
        <Pressable onPress={join} style={styles.secondary} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text style={styles.secondaryText}>Join pair</Text>}
        </Pressable>

        {!!profile?.activePairId && (
          <Text style={styles.small}>Active pair: {profile.activePairId}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, opacity: 0.75 },
  card: { marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#00000022', gap: 12 },
  primary: { borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#00000022' },
  primaryText: { fontSize: 16, fontWeight: '700' },
  secondary: { borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#00000022', opacity: 0.95 },
  secondaryText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 12, opacity: 0.7 },
  input: { borderWidth: 1, borderColor: '#00000022', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  divider: { height: 1, backgroundColor: '#00000022', marginVertical: 8 },
  codeBox: { borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#00000022' },
  code: { fontSize: 24, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  small: { fontSize: 12, opacity: 0.6 },
});
