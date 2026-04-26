import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import theme from '../lib/theme';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, SpinnerGap } from '@phosphor-icons/react';

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

export default function BasicSetupScreen() {
  const { refreshProfile, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [zodiacSign, setZodiacSign] = useState('');
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('anime');
  const [avatarData, setAvatarData] = useState(null);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    { title: "What should we call you?", subtitle: "Your display name" },
    { title: "When were you born?", subtitle: "For astrology insights" },
    { title: "What's your sign?", subtitle: "Select your zodiac" },
    { title: "Create your avatar", subtitle: "AI-generated profile picture" },
  ];

  const canProceed = () => {
    if (step === 0) return displayName.trim().length >= 2;
    if (step === 1) return true; // optional
    if (step === 2) return zodiacSign !== '';
    if (step === 3) return true; // avatar optional
    return false;
  };

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) return;
    setGeneratingAvatar(true);
    try {
      const { data } = await api.generateAvatar(avatarPrompt.trim(), avatarStyle);
      setAvatarData(data.avatar);
    } catch (err) {
      setError('Avatar generation failed. You can skip this step.');
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const handleNext = async () => {
    if (step < steps.length - 1) { setStep(step + 1); return; }
    setLoading(true);
    setError(null);
    try {
      await api.updateProfile({
        display_name: displayName.trim(),
        birth_date: birthDate || null,
        zodiac_sign: zodiacSign,
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

  const AVATAR_STYLES = [
    { key: 'anime', label: 'Anime' },
    { key: 'watercolor', label: 'Watercolor' },
    { key: 'cartoon', label: 'Cartoon' },
    { key: 'realistic', label: 'Realistic' },
  ];

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

        {/* Step 0: Name */}
        {step === 0 && (
          <input data-testid="setup-name-input" type="text" value={displayName}
            onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" autoFocus maxLength={30}
            style={{
              width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.none,
              border: `2px solid ${displayName.trim().length >= 2 ? '#D4AF37' : '#1F1F1F'}`,
              background: 'rgba(255,255,255,0.03)', color: '#FFF',
              fontSize: theme.typography.size.xl, textAlign: 'center', outline: 'none',
              boxSizing: 'border-box', fontFamily: theme.typography.fontFamily.primary,
            }}
          />
        )}

        {/* Step 1: DOB */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <input data-testid="setup-birthdate-input" type="date" value={birthDate}
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
              Optional — you can skip
            </p>
          </div>
        )}

        {/* Step 2: Zodiac */}
        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing[2] }}>
            {ZODIAC_OPTIONS.map((z) => (
              <button key={z.key} data-testid={`zodiac-${z.key}`} onClick={() => setZodiacSign(z.key)}
                style={{
                  padding: theme.spacing[3], borderRadius: theme.radius.none,
                  border: zodiacSign === z.key ? '2px solid #D4AF37' : '1px solid #1F1F1F',
                  background: zodiacSign === z.key ? 'rgba(212,175,55,0.08)' : 'transparent',
                  cursor: 'pointer', textAlign: 'center',
                }}>
                <span style={{ fontSize: '24px', display: 'block' }}>{z.symbol}</span>
                <span style={{ fontSize: theme.typography.size.xs, fontWeight: 600, color: zodiacSign === z.key ? '#D4AF37' : '#FFF', display: 'block', marginTop: '2px' }}>{z.name}</span>
                <span style={{ fontSize: '9px', color: '#555' }}>{z.dates}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Avatar */}
        {step === 3 && (
          <div>
            {avatarData && (
              <div style={{ textAlign: 'center', marginBottom: theme.spacing[4] }}>
                <img src={`data:image/png;base64,${avatarData}`} alt="Avatar"
                  style={{ width: '120px', height: '120px', borderRadius: '50%', border: '3px solid #D4AF37', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: theme.spacing[2], marginBottom: theme.spacing[3], flexWrap: 'wrap' }}>
              {AVATAR_STYLES.map((s) => (
                <button key={s.key} onClick={() => setAvatarStyle(s.key)} style={{
                  padding: `${theme.spacing[1]} ${theme.spacing[3]}`, borderRadius: theme.radius.none,
                  border: avatarStyle === s.key ? '1px solid #D4AF37' : '1px solid #1F1F1F',
                  background: avatarStyle === s.key ? 'rgba(212,175,55,0.08)' : 'transparent',
                  color: avatarStyle === s.key ? '#D4AF37' : '#9CA3AF',
                  fontSize: theme.typography.size.xs, fontWeight: 600, cursor: 'pointer',
                }}>{s.label}</button>
              ))}
            </div>

            <input data-testid="avatar-prompt-input" type="text" value={avatarPrompt}
              onChange={(e) => setAvatarPrompt(e.target.value)}
              placeholder="Describe yourself (e.g. curly hair, glasses, warm smile)"
              style={{
                width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.none,
                border: '1px solid #1F1F1F', background: 'rgba(255,255,255,0.03)',
                color: '#FFF', fontSize: theme.typography.size.sm, outline: 'none', boxSizing: 'border-box',
                marginBottom: theme.spacing[3],
              }}
            />
            <button data-testid="generate-avatar-btn" onClick={handleGenerateAvatar}
              disabled={!avatarPrompt.trim() || generatingAvatar}
              style={{
                width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.none,
                border: 'none',
                background: generatingAvatar ? '#1F1F1F' : (avatarPrompt.trim() ? '#9D4EDD' : '#1F1F1F'),
                color: avatarPrompt.trim() && !generatingAvatar ? '#FFF' : '#555',
                fontSize: theme.typography.size.sm, fontWeight: 700, cursor: generatingAvatar ? 'wait' : 'pointer',
                fontFamily: theme.typography.fontFamily.heading,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing[2],
              }}>
              {generatingAvatar ? <><SpinnerGap size={16} className="animate-glow" /> Generating...</> : <><Camera size={16} /> Generate Avatar</>}
            </button>
            <p style={{ marginTop: theme.spacing[2], fontSize: theme.typography.size.xs, color: '#555', textAlign: 'center' }}>
              You can skip this and create one later
            </p>
          </div>
        )}

        {/* Navigation */}
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
          <button data-testid="setup-next-btn" onClick={handleNext}
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
          >{loading ? 'Saving...' : (step === steps.length - 1 ? 'CONTINUE TO PAIRING' : 'NEXT')}</button>
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
