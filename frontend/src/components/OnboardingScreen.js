import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import theme from '../lib/theme';

const ZODIAC_OPTIONS = [
  { key: 'aries', symbol: '♈', name: 'Aries', dates: 'Mar 21 - Apr 19' },
  { key: 'taurus', symbol: '♉', name: 'Taurus', dates: 'Apr 20 - May 20' },
  { key: 'gemini', symbol: '♊', name: 'Gemini', dates: 'May 21 - Jun 20' },
  { key: 'cancer', symbol: '♋', name: 'Cancer', dates: 'Jun 21 - Jul 22' },
  { key: 'leo', symbol: '♌', name: 'Leo', dates: 'Jul 23 - Aug 22' },
  { key: 'virgo', symbol: '♍', name: 'Virgo', dates: 'Aug 23 - Sep 22' },
  { key: 'libra', symbol: '♎', name: 'Libra', dates: 'Sep 23 - Oct 22' },
  { key: 'scorpio', symbol: '♏', name: 'Scorpio', dates: 'Oct 23 - Nov 21' },
  { key: 'sagittarius', symbol: '♐', name: 'Sagittarius', dates: 'Nov 22 - Dec 21' },
  { key: 'capricorn', symbol: '♑', name: 'Capricorn', dates: 'Dec 22 - Jan 19' },
  { key: 'aquarius', symbol: '♒', name: 'Aquarius', dates: 'Jan 20 - Feb 18' },
  { key: 'pisces', symbol: '♓', name: 'Pisces', dates: 'Feb 19 - Mar 20' },
];

export default function OnboardingScreen() {
  const { refreshProfile, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [zodiacSign, setZodiacSign] = useState('');
  const [partnerZodiac, setPartnerZodiac] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    { title: "What should we call you?", subtitle: "Your display name" },
    { title: "What's your sign?", subtitle: "Select your zodiac" },
    { title: "What's your partner's sign?", subtitle: "We'll use this for compatibility" },
    { title: "When were you born?", subtitle: "Optional — helps with astrology" },
  ];

  const canProceed = () => {
    if (step === 0) return displayName.trim().length >= 2;
    if (step === 1) return zodiacSign !== '';
    if (step === 2) return partnerZodiac !== '';
    if (step === 3) return true; // birth date is optional
    return false;
  };

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    // Final step — save profile
    setLoading(true);
    setError(null);
    try {
      await api.updateProfile({
        display_name: displayName.trim(),
        zodiac_sign: zodiacSign,
        partner_zodiac: partnerZodiac,
        birth_date: birthDate || null,
        onboarding_complete: true,
      });
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
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
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: theme.spacing[2], marginBottom: theme.spacing[6] }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? '24px' : '8px',
              height: '8px',
              borderRadius: theme.radius.round,
              background: i <= step ? theme.colors.accent.primary : 'rgba(0,0,0,0.1)',
              transition: `all ${theme.motion.duration.normal}`,
            }}
          />
        ))}
      </div>

      {/* Step header */}
      <div style={{ textAlign: 'center', marginBottom: theme.spacing[6] }}>
        <h1 style={{
          fontSize: theme.typography.size.display,
          fontWeight: theme.typography.weight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[2],
        }}>
          {steps[step].title}
        </h1>
        <p style={{ fontSize: theme.typography.size.md, color: theme.colors.text.secondary }}>
          {steps[step].subtitle}
        </p>
      </div>

      {/* Step content */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: theme.colors.bg.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing[6],
        boxShadow: theme.shadow.card,
      }}>
        {error && (
          <div data-testid="onboarding-error" style={{
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

        {/* Step 0: Display Name */}
        {step === 0 && (
          <input
            data-testid="onboarding-name-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            autoFocus
            maxLength={30}
            style={{
              width: '100%',
              padding: theme.spacing[4],
              borderRadius: theme.radius.md,
              border: `2px solid ${displayName.trim().length >= 2 ? theme.colors.accent.primary : 'rgba(0,0,0,0.1)'}`,
              fontSize: theme.typography.size.xl,
              textAlign: 'center',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: theme.typography.fontFamily.primary,
              transition: `border-color ${theme.motion.duration.fast}`,
            }}
          />
        )}

        {/* Step 1: Your zodiac */}
        {step === 1 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: theme.spacing[2],
          }}>
            {ZODIAC_OPTIONS.map((z) => (
              <button
                key={z.key}
                data-testid={`zodiac-${z.key}`}
                onClick={() => setZodiacSign(z.key)}
                style={{
                  padding: theme.spacing[3],
                  borderRadius: theme.radius.lg,
                  border: zodiacSign === z.key
                    ? `2px solid ${theme.colors.accent.primary}`
                    : '1px solid rgba(0,0,0,0.08)',
                  background: zodiacSign === z.key ? 'rgba(255,111,174,0.08)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: `all ${theme.motion.duration.fast}`,
                }}
              >
                <span style={{ fontSize: '24px', display: 'block' }}>{z.symbol}</span>
                <span style={{
                  fontSize: theme.typography.size.xs,
                  fontWeight: theme.typography.weight.semibold,
                  color: zodiacSign === z.key ? theme.colors.accent.primary : theme.colors.text.primary,
                  display: 'block',
                  marginTop: theme.spacing[1],
                }}>
                  {z.name}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: theme.colors.text.muted,
                }}>
                  {z.dates}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Partner zodiac */}
        {step === 2 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: theme.spacing[2],
          }}>
            {ZODIAC_OPTIONS.map((z) => (
              <button
                key={z.key}
                data-testid={`partner-zodiac-${z.key}`}
                onClick={() => setPartnerZodiac(z.key)}
                style={{
                  padding: theme.spacing[3],
                  borderRadius: theme.radius.lg,
                  border: partnerZodiac === z.key
                    ? `2px solid ${theme.colors.accent.secondary}`
                    : '1px solid rgba(0,0,0,0.08)',
                  background: partnerZodiac === z.key ? 'rgba(201,167,255,0.1)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: `all ${theme.motion.duration.fast}`,
                }}
              >
                <span style={{ fontSize: '24px', display: 'block' }}>{z.symbol}</span>
                <span style={{
                  fontSize: theme.typography.size.xs,
                  fontWeight: theme.typography.weight.semibold,
                  color: partnerZodiac === z.key ? theme.colors.accent.secondary : theme.colors.text.primary,
                  display: 'block',
                  marginTop: theme.spacing[1],
                }}>
                  {z.name}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: theme.colors.text.muted,
                }}>
                  {z.dates}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Birth date */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <input
              data-testid="onboarding-birthdate-input"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing[4],
                borderRadius: theme.radius.md,
                border: '2px solid rgba(0,0,0,0.1)',
                fontSize: theme.typography.size.lg,
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: theme.typography.fontFamily.primary,
              }}
            />
            <p style={{
              marginTop: theme.spacing[3],
              fontSize: theme.typography.size.sm,
              color: theme.colors.text.muted,
            }}>
              This is optional — you can skip this step
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: theme.spacing[6],
          gap: theme.spacing[3],
        }}>
          {step > 0 ? (
            <button
              data-testid="onboarding-back-btn"
              onClick={handleBack}
              style={{
                padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
                borderRadius: theme.radius.md,
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'transparent',
                color: theme.colors.text.secondary,
                fontSize: theme.typography.size.md,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          ) : <div />}

          <button
            data-testid="onboarding-next-btn"
            onClick={handleNext}
            disabled={!canProceed() || loading}
            style={{
              padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
              borderRadius: theme.radius.md,
              border: 'none',
              background: canProceed() ? theme.colors.accent.primary : 'rgba(0,0,0,0.1)',
              color: canProceed() ? '#FFFFFF' : theme.colors.text.muted,
              fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold,
              cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1,
              transition: `all ${theme.motion.duration.fast}`,
            }}
          >
            {loading ? 'Saving...' : (step === steps.length - 1 ? 'Finish' : 'Next')}
          </button>
        </div>
      </div>

      <button
        data-testid="onboarding-signout-btn"
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
