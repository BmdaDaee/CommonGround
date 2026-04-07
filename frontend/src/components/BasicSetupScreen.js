import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import theme from '../lib/theme';
import { motion, AnimatePresence } from 'framer-motion';

export default function BasicSetupScreen() {
  const { refreshProfile, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    { title: "What should we call you?", subtitle: "Your display name" },
    { title: "When were you born?", subtitle: "Optional \u2014 helps with astrology" },
  ];

  const canProceed = () => {
    if (step === 0) return displayName.trim().length >= 2;
    if (step === 1) return true;
    return false;
  };

  const handleNext = async () => {
    if (step < steps.length - 1) { setStep(step + 1); return; }
    setLoading(true);
    setError(null);
    try {
      await api.updateProfile({
        display_name: displayName.trim(),
        birth_date: birthDate || null,
        basic_setup_complete: true,
      });
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => { if (step > 0) setStep(step - 1); };

  return (
    <div style={{
      minHeight: '100vh', background: '#050505',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing[6], fontFamily: theme.typography.fontFamily.primary,
    }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: theme.spacing[1], marginBottom: theme.spacing[6], width: '100%', maxWidth: '420px' }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '3px',
            background: i <= step ? (i === step ? '#D4AF37' : '#9D4EDD') : '#1F1F1F',
            transition: `all ${theme.motion.duration.normal}`,
          }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          style={{ textAlign: 'left', marginBottom: theme.spacing[6], width: '100%', maxWidth: '420px' }}
        >
          <p style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', fontFamily: theme.typography.fontFamily.heading, marginBottom: theme.spacing[1] }}>
            STEP {step + 1} OF {steps.length}
          </p>
          <h1 style={{
            fontSize: theme.typography.size.display, fontWeight: 900,
            color: '#FFF', fontFamily: theme.typography.fontFamily.heading,
            letterSpacing: '-0.02em', marginBottom: theme.spacing[1],
          }}>
            {steps[step].title}
          </h1>
          <p style={{ fontSize: theme.typography.size.md, color: '#9CA3AF' }}>{steps[step].subtitle}</p>
        </motion.div>
      </AnimatePresence>

      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid #1F1F1F',
        borderRadius: theme.radius.none, padding: theme.spacing[6],
      }}>
        {error && (
          <div data-testid="setup-error" style={{
            padding: theme.spacing[3], borderRadius: theme.radius.none,
            background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
            color: '#E63946', fontSize: theme.typography.size.sm,
            marginBottom: theme.spacing[4], textAlign: 'center',
          }}>{error}</div>
        )}

        {step === 0 && (
          <input
            data-testid="setup-name-input"
            type="text" value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name" autoFocus maxLength={30}
            style={{
              width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.none,
              border: `2px solid ${displayName.trim().length >= 2 ? '#D4AF37' : '#1F1F1F'}`,
              background: 'rgba(255,255,255,0.03)', color: '#FFF',
              fontSize: theme.typography.size.xl, textAlign: 'center', outline: 'none',
              boxSizing: 'border-box', fontFamily: theme.typography.fontFamily.primary,
            }}
          />
        )}

        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <input
              data-testid="setup-birthdate-input"
              type="date" value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              style={{
                width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.none,
                border: '2px solid #1F1F1F', background: 'rgba(255,255,255,0.03)',
                color: '#FFF', fontSize: theme.typography.size.lg,
                textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                fontFamily: theme.typography.fontFamily.primary, colorScheme: 'dark',
              }}
            />
            <p style={{ marginTop: theme.spacing[3], fontSize: theme.typography.size.sm, color: '#555555' }}>
              This is optional — you can skip this step
            </p>
          </div>
        )}

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: theme.spacing[6], gap: theme.spacing[3],
        }}>
          {step > 0 ? (
            <button data-testid="setup-back-btn" onClick={handleBack} style={{
              padding: `${theme.spacing[3]} ${theme.spacing[5]}`, borderRadius: theme.radius.none,
              border: '1px solid #1F1F1F', background: 'transparent',
              color: '#9CA3AF', fontSize: theme.typography.size.md, cursor: 'pointer',
            }}>Back</button>
          ) : <div />}
          <button
            data-testid="setup-next-btn" onClick={handleNext}
            disabled={!canProceed() || loading}
            style={{
              padding: `${theme.spacing[3]} ${theme.spacing[6]}`, borderRadius: theme.radius.none,
              border: 'none',
              background: canProceed() ? '#D4AF37' : '#1F1F1F',
              color: canProceed() ? '#000' : '#555555',
              fontSize: theme.typography.size.md, fontWeight: 700,
              cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1,
              fontFamily: theme.typography.fontFamily.heading, letterSpacing: '0.05em',
            }}
          >{loading ? 'Saving...' : (step === steps.length - 1 ? 'CONTINUE' : 'NEXT')}</button>
        </div>
      </div>

      <button data-testid="setup-signout-btn" onClick={signOut} style={{
        marginTop: theme.spacing[6], padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
        background: 'transparent', border: 'none', color: '#555555',
        fontSize: theme.typography.size.sm, cursor: 'pointer', textDecoration: 'underline',
      }}>Sign out</button>
    </div>
  );
}
