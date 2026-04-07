import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import theme from '../lib/theme';
import { motion, AnimatePresence } from 'framer-motion';

const ZODIAC_OPTIONS = [
  { key: 'aries', symbol: '\u2648', name: 'Aries', dates: 'Mar 21 - Apr 19' },
  { key: 'taurus', symbol: '\u2649', name: 'Taurus', dates: 'Apr 20 - May 20' },
  { key: 'gemini', symbol: '\u264A', name: 'Gemini', dates: 'May 21 - Jun 20' },
  { key: 'cancer', symbol: '\u264B', name: 'Cancer', dates: 'Jun 21 - Jul 22' },
  { key: 'leo', symbol: '\u264C', name: 'Leo', dates: 'Jul 23 - Aug 22' },
  { key: 'virgo', symbol: '\u264D', name: 'Virgo', dates: 'Aug 23 - Sep 22' },
  { key: 'libra', symbol: '\u264E', name: 'Libra', dates: 'Sep 23 - Oct 22' },
  { key: 'scorpio', symbol: '\u264F', name: 'Scorpio', dates: 'Oct 23 - Nov 21' },
  { key: 'sagittarius', symbol: '\u2650', name: 'Sagittarius', dates: 'Nov 22 - Dec 21' },
  { key: 'capricorn', symbol: '\u2651', name: 'Capricorn', dates: 'Dec 22 - Jan 19' },
  { key: 'aquarius', symbol: '\u2652', name: 'Aquarius', dates: 'Jan 20 - Feb 18' },
  { key: 'pisces', symbol: '\u2653', name: 'Pisces', dates: 'Feb 19 - Mar 20' },
];

const GENDER_OPTIONS = [
  { key: 'man', label: 'Man' },
  { key: 'woman', label: 'Woman' },
  { key: 'non-binary', label: 'Non-Binary' },
  { key: 'other', label: 'Other' },
];

const ETHNICITY_OPTIONS = [
  { key: 'black', label: 'Black' },
  { key: 'white', label: 'White' },
  { key: 'latino', label: 'Latino/Latina' },
  { key: 'asian', label: 'Asian' },
  { key: 'south-asian', label: 'South Asian' },
  { key: 'middle-eastern', label: 'Middle Eastern' },
  { key: 'indigenous', label: 'Indigenous' },
  { key: 'pacific-islander', label: 'Pacific Islander' },
  { key: 'mixed', label: 'Mixed' },
  { key: 'other', label: 'Other' },
];

export default function OnboardingScreen() {
  const { refreshProfile, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [partnerGender, setPartnerGender] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [zodiacSign, setZodiacSign] = useState('');
  const [partnerZodiac, setPartnerZodiac] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    { title: "What should we call you?", subtitle: "Your display name" },
    { title: "How do you identify?", subtitle: "Your gender" },
    { title: "How does your partner identify?", subtitle: "Partner's gender" },
    { title: "What's your ethnicity?", subtitle: "Helps personalize your AI avatars" },
    { title: "What's your sign?", subtitle: "Select your zodiac" },
    { title: "Partner's sign?", subtitle: "We'll use this for compatibility" },
    { title: "When were you born?", subtitle: "Optional \u2014 helps with astrology" },
  ];

  const canProceed = () => {
    if (step === 0) return displayName.trim().length >= 2;
    if (step === 1) return gender !== '';
    if (step === 2) return partnerGender !== '';
    if (step === 3) return ethnicity !== '';
    if (step === 4) return zodiacSign !== '';
    if (step === 5) return partnerZodiac !== '';
    if (step === 6) return true;
    return false;
  };

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.updateProfile({
        display_name: displayName.trim(),
        gender,
        partner_gender: partnerGender,
        ethnicity,
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

  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const SelectionGrid = ({ options, selected, onSelect, testPrefix }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing[2] }}>
      {options.map((opt) => (
        <button
          key={opt.key}
          data-testid={`${testPrefix}-${opt.key}`}
          onClick={() => onSelect(opt.key)}
          style={{
            padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
            borderRadius: theme.radius.none,
            border: selected === opt.key ? '2px solid #D4AF37' : '1px solid #1F1F1F',
            background: selected === opt.key ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)',
            color: selected === opt.key ? '#D4AF37' : '#FFF',
            fontSize: theme.typography.size.md,
            fontWeight: selected === opt.key ? 700 : 500,
            cursor: 'pointer',
            textAlign: 'center',
            transition: `all ${theme.motion.duration.fast}`,
            fontFamily: theme.typography.fontFamily.primary,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing[6],
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: theme.spacing[1], marginBottom: theme.spacing[6], width: '100%', maxWidth: '420px' }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: '3px',
              background: i <= step
                ? i === step ? '#D4AF37' : '#9D4EDD'
                : '#1F1F1F',
              transition: `all ${theme.motion.duration.normal}`,
            }}
          />
        ))}
      </div>

      {/* Step header */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
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
          <p style={{ fontSize: theme.typography.size.md, color: '#9CA3AF' }}>
            {steps[step].subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Step content */}
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid #1F1F1F',
        borderRadius: theme.radius.none,
        padding: theme.spacing[6],
      }}>
        {error && (
          <div data-testid="onboarding-error" style={{
            padding: theme.spacing[3], borderRadius: theme.radius.none,
            background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
            color: '#E63946', fontSize: theme.typography.size.sm,
            marginBottom: theme.spacing[4], textAlign: 'center',
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
              width: '100%', padding: theme.spacing[4],
              borderRadius: theme.radius.none,
              border: `2px solid ${displayName.trim().length >= 2 ? '#D4AF37' : '#1F1F1F'}`,
              background: 'rgba(255,255,255,0.03)', color: '#FFF',
              fontSize: theme.typography.size.xl, textAlign: 'center', outline: 'none',
              boxSizing: 'border-box', fontFamily: theme.typography.fontFamily.primary,
              transition: `border-color ${theme.motion.duration.fast}`,
            }}
          />
        )}

        {/* Step 1: Your Gender */}
        {step === 1 && (
          <SelectionGrid options={GENDER_OPTIONS} selected={gender} onSelect={setGender} testPrefix="gender" />
        )}

        {/* Step 2: Partner Gender */}
        {step === 2 && (
          <SelectionGrid options={GENDER_OPTIONS} selected={partnerGender} onSelect={setPartnerGender} testPrefix="partner-gender" />
        )}

        {/* Step 3: Ethnicity */}
        {step === 3 && (
          <SelectionGrid options={ETHNICITY_OPTIONS} selected={ethnicity} onSelect={setEthnicity} testPrefix="ethnicity" />
        )}

        {/* Step 4: Your zodiac */}
        {step === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing[2] }}>
            {ZODIAC_OPTIONS.map((z) => (
              <button
                key={z.key}
                data-testid={`zodiac-${z.key}`}
                onClick={() => setZodiacSign(z.key)}
                style={{
                  padding: theme.spacing[3], borderRadius: theme.radius.none,
                  border: zodiacSign === z.key ? '2px solid #D4AF37' : '1px solid #1F1F1F',
                  background: zodiacSign === z.key ? 'rgba(212,175,55,0.08)' : 'transparent',
                  cursor: 'pointer', textAlign: 'center',
                  transition: `all ${theme.motion.duration.fast}`,
                }}
              >
                <span style={{ fontSize: '24px', display: 'block' }}>{z.symbol}</span>
                <span style={{
                  fontSize: theme.typography.size.xs, fontWeight: 600,
                  color: zodiacSign === z.key ? '#D4AF37' : '#FFF',
                  display: 'block', marginTop: theme.spacing[1],
                }}>{z.name}</span>
                <span style={{ fontSize: '10px', color: '#555555' }}>{z.dates}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 5: Partner zodiac */}
        {step === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing[2] }}>
            {ZODIAC_OPTIONS.map((z) => (
              <button
                key={z.key}
                data-testid={`partner-zodiac-${z.key}`}
                onClick={() => setPartnerZodiac(z.key)}
                style={{
                  padding: theme.spacing[3], borderRadius: theme.radius.none,
                  border: partnerZodiac === z.key ? '2px solid #9D4EDD' : '1px solid #1F1F1F',
                  background: partnerZodiac === z.key ? 'rgba(157,78,221,0.08)' : 'transparent',
                  cursor: 'pointer', textAlign: 'center',
                  transition: `all ${theme.motion.duration.fast}`,
                }}
              >
                <span style={{ fontSize: '24px', display: 'block' }}>{z.symbol}</span>
                <span style={{
                  fontSize: theme.typography.size.xs, fontWeight: 600,
                  color: partnerZodiac === z.key ? '#9D4EDD' : '#FFF',
                  display: 'block', marginTop: theme.spacing[1],
                }}>{z.name}</span>
                <span style={{ fontSize: '10px', color: '#555555' }}>{z.dates}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 6: Birth date */}
        {step === 6 && (
          <div style={{ textAlign: 'center' }}>
            <input
              data-testid="onboarding-birthdate-input"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              style={{
                width: '100%', padding: theme.spacing[4],
                borderRadius: theme.radius.none,
                border: '2px solid #1F1F1F', background: 'rgba(255,255,255,0.03)',
                color: '#FFF', fontSize: theme.typography.size.lg,
                textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                fontFamily: theme.typography.fontFamily.primary,
                colorScheme: 'dark',
              }}
            />
            <p style={{ marginTop: theme.spacing[3], fontSize: theme.typography.size.sm, color: '#555555' }}>
              This is optional — you can skip this step
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: theme.spacing[6], gap: theme.spacing[3],
        }}>
          {step > 0 ? (
            <button
              data-testid="onboarding-back-btn"
              onClick={handleBack}
              style={{
                padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
                borderRadius: theme.radius.none,
                border: '1px solid #1F1F1F', background: 'transparent',
                color: '#9CA3AF', fontSize: theme.typography.size.md, cursor: 'pointer',
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
              borderRadius: theme.radius.none, border: 'none',
              background: canProceed() ? '#D4AF37' : '#1F1F1F',
              color: canProceed() ? '#000' : '#555555',
              fontSize: theme.typography.size.md, fontWeight: 700,
              cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1,
              fontFamily: theme.typography.fontFamily.heading,
              letterSpacing: '0.05em',
              transition: `all ${theme.motion.duration.fast}`,
            }}
          >
            {loading ? 'Saving...' : (step === steps.length - 1 ? 'FINISH' : 'NEXT')}
          </button>
        </div>
      </div>

      <button
        data-testid="onboarding-signout-btn"
        onClick={signOut}
        style={{
          marginTop: theme.spacing[6], padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
          background: 'transparent', border: 'none',
          color: '#555555', fontSize: theme.typography.size.sm,
          cursor: 'pointer', textDecoration: 'underline',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
