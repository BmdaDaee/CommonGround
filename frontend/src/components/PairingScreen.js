import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import theme from '../lib/theme';

export default function PairingScreen() {
  const { refreshProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdCode, setCreatedCode] = useState(null);
  const [joinCode, setJoinCode] = useState('');

  const handleCreatePair = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.createPair();
      setCreatedCode(data.code);
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create pair');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPair = async () => {
    if (!joinCode.trim()) {
      setError('Enter a pair code');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await api.joinPair(joinCode.trim().toUpperCase());
      await refreshProfile();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'pair_not_found') {
        setError('Pair code not found. Check the code and try again.');
      } else if (detail === 'cannot_join_own_pair') {
        setError("You can't join your own pair!");
      } else {
        setError(detail || err.message || 'Failed to join pair');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${theme.colors.bg.primary} 0%, ${theme.colors.bg.secondary} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing[6],
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ textAlign: 'center', marginBottom: theme.spacing[6] }}>
        <h1 style={{
          fontSize: theme.typography.size.display,
          fontWeight: theme.typography.weight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[2],
        }}>
          Pair Up
        </h1>
        <p style={{
          fontSize: theme.typography.size.md,
          color: theme.colors.text.secondary,
        }}>
          Create a pair or join your partner
        </p>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: theme.colors.bg.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing[6],
        boxShadow: theme.shadow.card,
      }}>
        {error && (
          <div data-testid="pair-error" style={{
            padding: theme.spacing[3],
            borderRadius: theme.radius.md,
            background: '#FFE4E4',
            color: '#B00020',
            fontSize: theme.typography.size.sm,
            marginBottom: theme.spacing[4],
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Create Pair */}
        <button
          data-testid="create-pair-btn"
          onClick={handleCreatePair}
          disabled={loading || createdCode}
          style={{
            width: '100%',
            padding: theme.spacing[4],
            borderRadius: theme.radius.md,
            border: 'none',
            background: createdCode ? theme.colors.accent.highlight : theme.colors.accent.primary,
            color: createdCode ? theme.colors.text.primary : '#FFFFFF',
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
            cursor: loading || createdCode ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: `all ${theme.motion.duration.fast}`,
          }}
        >
          {loading ? 'Creating...' : (createdCode ? 'Pair Created!' : 'Create Pair')}
        </button>

        {createdCode && (
          <div data-testid="pair-code-display" style={{
            marginTop: theme.spacing[4],
            padding: theme.spacing[5],
            borderRadius: theme.radius.lg,
            border: `2px dashed ${theme.colors.accent.primary}`,
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: theme.typography.size.sm,
              color: theme.colors.text.muted,
              marginBottom: theme.spacing[2],
            }}>
              Share this code with your partner:
            </p>
            <p style={{
              fontSize: theme.typography.size.hero,
              fontWeight: theme.typography.weight.bold,
              color: theme.colors.accent.primary,
              letterSpacing: '4px',
              fontFamily: 'monospace',
            }}>
              {createdCode}
            </p>
            <p style={{
              fontSize: theme.typography.size.xs,
              color: theme.colors.text.muted,
              marginTop: theme.spacing[2],
            }}>
              Waiting for them to join...
            </p>
          </div>
        )}

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: `${theme.spacing[6]} 0`,
          gap: theme.spacing[3],
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
          <span style={{ fontSize: theme.typography.size.sm, color: theme.colors.text.muted }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
        </div>

        {/* Join Pair */}
        <div>
          <label style={{
            fontSize: theme.typography.size.sm,
            color: theme.colors.text.muted,
            display: 'block',
            marginBottom: theme.spacing[2],
          }}>
            Join with code
          </label>
          <input
            data-testid="join-code-input"
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="AB12CD"
            maxLength={6}
            style={{
              width: '100%',
              padding: theme.spacing[4],
              borderRadius: theme.radius.md,
              border: `1px solid rgba(0,0,0,0.1)`,
              fontSize: theme.typography.size.lg,
              textAlign: 'center',
              letterSpacing: '4px',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            data-testid="join-pair-btn"
            onClick={handleJoinPair}
            disabled={loading || !joinCode.trim()}
            style={{
              width: '100%',
              marginTop: theme.spacing[3],
              padding: theme.spacing[4],
              borderRadius: theme.radius.md,
              border: `2px solid ${theme.colors.accent.primary}`,
              background: 'transparent',
              color: theme.colors.accent.primary,
              fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold,
              cursor: loading || !joinCode.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !joinCode.trim() ? 0.5 : 1,
              transition: `all ${theme.motion.duration.fast}`,
            }}
          >
            {loading ? 'Joining...' : 'Join Pair'}
          </button>
        </div>
      </div>

      <button
        data-testid="sign-out-btn"
        onClick={signOut}
        style={{
          marginTop: theme.spacing[6],
          padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
          background: 'transparent',
          border: 'none',
          color: theme.colors.text.muted,
          fontSize: theme.typography.size.sm,
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
