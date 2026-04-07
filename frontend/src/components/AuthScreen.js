import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../lib/theme';
import { motion } from 'framer-motion';

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
      if (!email.trim() || !password) throw new Error('Enter email and password');
      if (mode === 'signUp' && password.length < 8) throw new Error('Password must be at least 8 characters');
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

  const inputStyle = {
    width: '100%', padding: theme.spacing[4],
    borderRadius: theme.radius.none,
    border: '1px solid #1F1F1F',
    background: 'rgba(255,255,255,0.03)', color: '#FFF',
    fontSize: theme.typography.size.md, outline: 'none',
    boxSizing: 'border-box',
    fontFamily: theme.typography.fontFamily.primary,
    transition: `border-color ${theme.motion.duration.fast}`,
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050505',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing[6], fontFamily: theme.typography.fontFamily.primary,
    }}>
      {/* Brand */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: theme.spacing[8] }}
      >
        <h1 style={{
          fontSize: theme.typography.size.hero, fontWeight: 900,
          fontFamily: theme.typography.fontFamily.heading, color: '#FFF',
          letterSpacing: '-0.03em', lineHeight: 1.0,
          marginBottom: theme.spacing[2],
        }}>
          Common<span style={{ color: '#D4AF37' }}>Ground</span>
        </h1>
        <p style={{ fontSize: theme.typography.size.md, color: '#9CA3AF' }}>
          Find your shared emotional space
        </p>
      </motion.div>

      {/* Auth Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          width: '100%', maxWidth: '380px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid #1F1F1F',
          borderRadius: theme.radius.none,
          padding: theme.spacing[6],
        }}
      >
        <h2 style={{
          fontSize: theme.typography.size.xl, fontWeight: 700,
          color: '#FFF', marginBottom: theme.spacing[5],
          textAlign: 'center', fontFamily: theme.typography.fontFamily.heading,
        }}>
          {mode === 'signIn' ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div data-testid="auth-error" style={{
            padding: theme.spacing[3], borderRadius: theme.radius.none,
            background: error.includes('Check your email') ? 'rgba(212,175,55,0.1)' : 'rgba(230,57,70,0.1)',
            border: `1px solid ${error.includes('Check your email') ? 'rgba(212,175,55,0.3)' : 'rgba(230,57,70,0.3)'}`,
            color: error.includes('Check your email') ? '#D4AF37' : '#E63946',
            fontSize: theme.typography.size.sm,
            marginBottom: theme.spacing[4], textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
          <div>
            <label style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF', display: 'block', marginBottom: theme.spacing[1], fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              data-testid="auth-email-input"
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF', display: 'block', marginBottom: theme.spacing[1], fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Password
            </label>
            <input
              data-testid="auth-password-input"
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signUp' ? 'At least 8 characters' : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
              style={inputStyle}
            />
          </div>

          <button
            data-testid="auth-submit-btn"
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: theme.spacing[4],
              borderRadius: theme.radius.none, border: 'none',
              background: '#D4AF37', color: '#000',
              fontSize: theme.typography.size.md, fontWeight: 700,
              fontFamily: theme.typography.fontFamily.heading,
              letterSpacing: '0.05em',
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
          onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setError(null); }}
          style={{
            width: '100%', padding: theme.spacing[3], marginTop: theme.spacing[4],
            background: 'transparent', border: 'none',
            color: '#D4AF37', fontSize: theme.typography.size.sm,
            cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </motion.div>

      <p style={{ marginTop: theme.spacing[6], fontSize: theme.typography.size.xs, color: '#555555', textAlign: 'center' }}>
        A private space for two
      </p>
    </div>
  );
}
