import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import theme from '../lib/theme';
import { motion } from 'framer-motion';

export default function PairingScreen() {
  const { refreshProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdCode, setCreatedCode] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [polling, setPolling] = useState(false);

  // Poll for partner joining after creating a pair
  const pollForPartner = useCallback(async () => {
    try {
      const { data } = await api.getMyPair();
      if (data.pair?.status === 'ACTIVE') {
        await refreshProfile();
      }
    } catch (err) {}
  }, [refreshProfile]);

  useEffect(() => {
    if (!createdCode || polling) return;
    setPolling(true);
    const interval = setInterval(pollForPartner, 4000);
    return () => clearInterval(interval);
  }, [createdCode, polling, pollForPartner]);

  const handleCreatePair = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.createPair();
      setCreatedCode(data.code);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create pair');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPair = async () => {
    if (!joinCode.trim()) { setError('Enter a pair code'); return; }
    setLoading(true);
    setError(null);
    try {
      await api.joinPair(joinCode.trim().toUpperCase());
      await refreshProfile();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'pair_not_found') setError('Code not found. Check and try again.');
      else if (detail === 'cannot_join_own_pair') setError("You can't join your own pair!");
      else setError(detail || 'Failed to join pair');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050505',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing[6], fontFamily: theme.typography.fontFamily.primary,
    }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'left', marginBottom: theme.spacing[6], width: '100%', maxWidth: '380px' }}
      >
        <p style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', fontFamily: theme.typography.fontFamily.heading, marginBottom: theme.spacing[1] }}>
          CONNECT
        </p>
        <h1 style={{
          fontSize: theme.typography.size.display, fontWeight: 900,
          color: '#FFF', fontFamily: theme.typography.fontFamily.heading,
          letterSpacing: '-0.02em', marginBottom: theme.spacing[1],
        }}>Pair Up</h1>
        <p style={{ fontSize: theme.typography.size.md, color: '#9CA3AF' }}>
          Create a pair or join your partner to continue
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{
          width: '100%', maxWidth: '380px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid #1F1F1F',
          borderRadius: theme.radius.none, padding: theme.spacing[6],
        }}
      >
        {error && (
          <div data-testid="pair-error" style={{
            padding: theme.spacing[3], borderRadius: theme.radius.none,
            background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
            color: '#E63946', fontSize: theme.typography.size.sm,
            marginBottom: theme.spacing[4], textAlign: 'center',
          }}>{error}</div>
        )}

        {/* Create Pair */}
        <button
          data-testid="create-pair-btn"
          onClick={handleCreatePair}
          disabled={loading || createdCode}
          style={{
            width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.none,
            border: 'none',
            background: createdCode ? '#9D4EDD' : '#D4AF37',
            color: createdCode ? '#FFF' : '#000',
            fontSize: theme.typography.size.md, fontWeight: 700,
            fontFamily: theme.typography.fontFamily.heading, letterSpacing: '0.05em',
            cursor: loading || createdCode ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading && !createdCode ? 'Creating...' : (createdCode ? 'Pair Created!' : 'CREATE PAIR')}
        </button>

        {createdCode && (
          <div data-testid="pair-code-display" style={{
            marginTop: theme.spacing[4], padding: theme.spacing[5],
            border: '2px dashed #D4AF37', textAlign: 'center',
          }}>
            <p style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF', marginBottom: theme.spacing[2], letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Share this code with your partner
            </p>
            <p style={{
              fontSize: theme.typography.size.hero, fontWeight: 900,
              color: '#D4AF37', letterSpacing: '6px',
              fontFamily: theme.typography.fontFamily.heading,
            }}>{createdCode}</p>
            <p style={{ fontSize: theme.typography.size.xs, color: '#555555', marginTop: theme.spacing[2] }}>
              Waiting for them to join...
            </p>
          </div>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: `${theme.spacing[6]} 0`, gap: theme.spacing[3] }}>
          <div style={{ flex: 1, height: '1px', background: '#1F1F1F' }} />
          <span style={{ fontSize: theme.typography.size.sm, color: '#555555', fontWeight: 600 }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#1F1F1F' }} />
        </div>

        {/* Join Pair */}
        <div>
          <label style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF', display: 'block', marginBottom: theme.spacing[2], fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Join with code
          </label>
          <input
            data-testid="join-code-input"
            type="text" value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="AB12CD" maxLength={6}
            style={{
              width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.none,
              border: '1px solid #1F1F1F', background: 'rgba(255,255,255,0.03)',
              color: '#FFF', fontSize: theme.typography.size.lg,
              textAlign: 'center', letterSpacing: '6px',
              fontFamily: theme.typography.fontFamily.heading, textTransform: 'uppercase',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            data-testid="join-pair-btn"
            onClick={handleJoinPair}
            disabled={loading || !joinCode.trim()}
            style={{
              width: '100%', marginTop: theme.spacing[3], padding: theme.spacing[4],
              borderRadius: theme.radius.none,
              border: '2px solid #D4AF37', background: 'transparent',
              color: '#D4AF37', fontSize: theme.typography.size.md, fontWeight: 700,
              fontFamily: theme.typography.fontFamily.heading, letterSpacing: '0.05em',
              cursor: loading || !joinCode.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !joinCode.trim() ? 0.5 : 1,
            }}
          >{loading ? 'Joining...' : 'JOIN PAIR'}</button>
        </div>
      </motion.div>

      <button data-testid="sign-out-btn" onClick={signOut} style={{
        marginTop: theme.spacing[6], padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
        background: 'transparent', border: 'none', color: '#555555',
        fontSize: theme.typography.size.sm, cursor: 'pointer', textDecoration: 'underline',
      }}>Sign out</button>
    </div>
  );
}
