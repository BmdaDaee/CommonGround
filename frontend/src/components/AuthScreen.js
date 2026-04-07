import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../lib/theme';

export default function AuthScreen() {
  const [mode, setMode] = useState('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error('Enter email and password');
      }
      
      if (mode === 'signUp' && password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (mode === 'signUp') {
        await signUp(email.trim(), password);
        setError('Check your email for confirmation link!');
        setMode('signIn');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
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
      {/* Logo/Brand */}
      <div style={{ textAlign: 'center', marginBottom: theme.spacing[8] }}>
        <h1 style={{
          fontSize: theme.typography.size.hero,
          fontWeight: theme.typography.weight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[2],
          lineHeight: theme.typography.lineHeight.tight,
        }}>
          CommonGround
        </h1>
        <p style={{
          fontSize: theme.typography.size.md,
          color: theme.colors.text.secondary,
        }}>
          Find your shared emotional space
        </p>
      </div>

      {/* Auth Card */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: theme.colors.bg.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing[6],
        boxShadow: theme.shadow.card,
      }}>
        <h2 style={{
          fontSize: theme.typography.size.xl,
          fontWeight: theme.typography.weight.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[5],
          textAlign: 'center',
        }}>
          {mode === 'signIn' ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div data-testid="auth-error" style={{
            padding: theme.spacing[3],
            borderRadius: theme.radius.md,
            background: error.includes('Check your email') ? theme.colors.accent.highlight : '#FFE4E4',
            color: error.includes('Check your email') ? theme.colors.text.primary : '#B00020',
            fontSize: theme.typography.size.sm,
            marginBottom: theme.spacing[4],
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
          <div>
            <label style={{
              fontSize: theme.typography.size.sm,
              color: theme.colors.text.muted,
              display: 'block',
              marginBottom: theme.spacing[1],
            }}>
              Email
            </label>
            <input
              data-testid="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: theme.spacing[4],
                borderRadius: theme.radius.md,
                border: `1px solid rgba(0,0,0,0.1)`,
                fontSize: theme.typography.size.md,
                outline: 'none',
                transition: `border-color ${theme.motion.duration.fast}`,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{
              fontSize: theme.typography.size.sm,
              color: theme.colors.text.muted,
              display: 'block',
              marginBottom: theme.spacing[1],
            }}>
              Password
            </label>
            <input
              data-testid="auth-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signUp' ? 'At least 8 characters' : '••••••••'}
              style={{
                width: '100%',
                padding: theme.spacing[4],
                borderRadius: theme.radius.md,
                border: `1px solid rgba(0,0,0,0.1)`,
                fontSize: theme.typography.size.md,
                outline: 'none',
                transition: `border-color ${theme.motion.duration.fast}`,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            data-testid="auth-submit-btn"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: theme.spacing[4],
              borderRadius: theme.radius.md,
              border: 'none',
              background: theme.colors.accent.primary,
              color: '#FFFFFF',
              fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: `all ${theme.motion.duration.fast}`,
            }}
          >
            {loading ? 'Please wait...' : (mode === 'signIn' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <button
          data-testid="auth-toggle-mode"
          onClick={() => {
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
            setError(null);
          }}
          style={{
            width: '100%',
            padding: theme.spacing[3],
            marginTop: theme.spacing[4],
            background: 'transparent',
            border: 'none',
            color: theme.colors.text.accent,
            fontSize: theme.typography.size.sm,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>

      <p style={{
        marginTop: theme.spacing[6],
        fontSize: theme.typography.size.xs,
        color: theme.colors.text.muted,
        textAlign: 'center',
      }}>
        A private space for two
      </p>
    </div>
  );
}
