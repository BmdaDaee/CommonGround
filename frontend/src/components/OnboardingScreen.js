import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import theme from '../lib/theme';
import { motion, AnimatePresence } from 'framer-motion';

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

const PERSONALITY_QUESTIONS = [
  { q: "When you're stressed, you prefer to:", a: "Talk it out with someone", b: "Process it alone first" },
  { q: "In a relationship, you feel loved when your partner:", a: "Tells you how they feel", b: "Shows love through actions" },
  { q: "When there's conflict, you tend to:", a: "Address it immediately", b: "Take time before discussing" },
  { q: "Your ideal date night is:", a: "Going out somewhere exciting", b: "Staying in together" },
  { q: "You show affection by:", a: "Physical touch & closeness", b: "Words & thoughtful gestures" },
];

const RELATIONSHIP_QUESTIONS = [
  { q: "What matters most to you in a relationship?", opts: ['Trust', 'Communication', 'Passion', 'Adventure'] },
  { q: "How do you handle disagreements?", opts: ['Compromise quickly', 'Discuss until resolved', 'Take space then talk', 'Avoid conflict'] },
  { q: "What's your attachment style?", opts: ['Secure — I trust easily', 'Anxious — I need reassurance', 'Avoidant — I need space', "Not sure yet"] },
];

const ZODIAC_OPTIONS = [
  { key: 'aries', symbol: '\u2648', name: 'Aries' }, { key: 'taurus', symbol: '\u2649', name: 'Taurus' },
  { key: 'gemini', symbol: '\u264A', name: 'Gemini' }, { key: 'cancer', symbol: '\u264B', name: 'Cancer' },
  { key: 'leo', symbol: '\u264C', name: 'Leo' }, { key: 'virgo', symbol: '\u264D', name: 'Virgo' },
  { key: 'libra', symbol: '\u264E', name: 'Libra' }, { key: 'scorpio', symbol: '\u264F', name: 'Scorpio' },
  { key: 'sagittarius', symbol: '\u2650', name: 'Sagittarius' }, { key: 'capricorn', symbol: '\u2651', name: 'Capricorn' },
  { key: 'aquarius', symbol: '\u2652', name: 'Aquarius' }, { key: 'pisces', symbol: '\u2653', name: 'Pisces' },
];

export default function OnboardingScreen() {
  const { refreshProfile, pair, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState('');
  const [partnerGender, setPartnerGender] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [partnerZodiac, setPartnerZodiac] = useState('');
  const [personalityAnswers, setPersonalityAnswers] = useState([]);
  const [relationshipAnswers, setRelationshipAnswers] = useState([]);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load partner info on mount
  useEffect(() => {
    const loadPartner = async () => {
      try {
        const { data } = await api.getMyPair();
        setPartnerInfo(data.partner);
      } catch (err) {}
    };
    loadPartner();
  }, []);

  // Steps: partner welcome, gender, partner gender, ethnicity, partner zodiac, personality quiz (5), relationship quiz (3)
  const totalSteps = 5 + PERSONALITY_QUESTIONS.length + RELATIONSHIP_QUESTIONS.length;
  const personalityStart = 5;
  const relationshipStart = personalityStart + PERSONALITY_QUESTIONS.length;

  const getStepInfo = () => {
    if (step === 0) return { title: partnerInfo ? `You're linked with ${partnerInfo.display_name || 'your partner'}!` : "You're paired!", subtitle: "Now let's learn about you both" };
    if (step === 1) return { title: "How do you identify?", subtitle: "Your gender" };
    if (step === 2) return { title: "How does your partner identify?", subtitle: "Partner's gender" };
    if (step === 3) return { title: "What's your ethnicity?", subtitle: "Personalizes your AI avatars" };
    if (step === 4) return { title: "Partner's sign?", subtitle: "For compatibility insights" };
    if (step >= personalityStart && step < relationshipStart) {
      const qi = step - personalityStart;
      return { title: "Personality Quiz", subtitle: `Question ${qi + 1} of ${PERSONALITY_QUESTIONS.length}` };
    }
    if (step >= relationshipStart) {
      const qi = step - relationshipStart;
      return { title: "Relationship Style", subtitle: `Question ${qi + 1} of ${RELATIONSHIP_QUESTIONS.length}` };
    }
    return { title: "", subtitle: "" };
  };

  const canProceed = () => {
    if (step === 0) return true; // welcome - just proceed
    if (step === 1) return gender !== '';
    if (step === 2) return partnerGender !== '';
    if (step === 3) return ethnicity !== '';
    if (step === 4) return partnerZodiac !== '';
    if (step >= personalityStart && step < relationshipStart) return personalityAnswers.length > (step - personalityStart);
    if (step >= relationshipStart) return relationshipAnswers.length > (step - relationshipStart);
    return false;
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) { setStep(step + 1); return; }
    // Final step — save everything
    setLoading(true);
    setError(null);
    try {
      await api.updateProfile({
        gender, partner_gender: partnerGender, ethnicity, partner_zodiac: partnerZodiac,
        onboarding_complete: true,
      });
      // Submit personality quiz data
      try {
        const quizData = {
          personality: personalityAnswers,
          relationship: relationshipAnswers,
        };
        await api.submitOnboardingQuiz(quizData);
      } catch (err) { /* non-critical */ }
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const SelectionGrid = ({ options, selected, onSelect, testPrefix, cols = 2 }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: theme.spacing[2] }}>
      {options.map((opt) => (
        <button key={opt.key} data-testid={`${testPrefix}-${opt.key}`} onClick={() => onSelect(opt.key)}
          style={{
            padding: `${theme.spacing[3]} ${theme.spacing[4]}`, borderRadius: theme.radius.none,
            border: selected === opt.key ? '2px solid #D4AF37' : '1px solid #1F1F1F',
            background: selected === opt.key ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)',
            color: selected === opt.key ? '#D4AF37' : '#FFF',
            fontSize: theme.typography.size.md, fontWeight: selected === opt.key ? 700 : 500,
            cursor: 'pointer', textAlign: 'center',
          }}>{opt.label}</button>
      ))}
    </div>
  );

  const info = getStepInfo();
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div style={{
      minHeight: '100vh', background: '#050505',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing[6], fontFamily: theme.typography.fontFamily.primary,
    }}>
      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '420px', height: '3px', background: '#1F1F1F', marginBottom: theme.spacing[6] }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #D4AF37, #9D4EDD)', transition: 'width 0.3s ease' }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          style={{ textAlign: 'left', marginBottom: theme.spacing[5], width: '100%', maxWidth: '420px' }}
        >
          <p style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', fontFamily: theme.typography.fontFamily.heading, marginBottom: theme.spacing[1] }}>
            {info.subtitle}
          </p>
          <h1 style={{ fontSize: theme.typography.size.display, fontWeight: 900, color: '#FFF', fontFamily: theme.typography.fontFamily.heading, letterSpacing: '-0.02em' }}>
            {info.title}
          </h1>
        </motion.div>
      </AnimatePresence>

      <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1F1F1F', borderRadius: theme.radius.none, padding: theme.spacing[6] }}>
        {error && (
          <div data-testid="onboarding-error" style={{ padding: theme.spacing[3], background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', color: '#E63946', fontSize: theme.typography.size.sm, marginBottom: theme.spacing[4], textAlign: 'center' }}>{error}</div>
        )}

        {/* Step 0: Partner welcome */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            {partnerInfo && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing[4], marginBottom: theme.spacing[4] }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #9D4EDD)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#FFF', fontWeight: 700 }}>
                  {(partnerInfo.display_name || '?')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '32px', color: '#D4AF37' }}>&amp;</span>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #9D4EDD, #E63946)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#FFF', fontWeight: 700 }}>
                  You
                </div>
              </div>
            )}
            <p data-testid="partner-welcome-text" style={{ color: '#9CA3AF', fontSize: theme.typography.size.md }}>
              {partnerInfo
                ? `You and ${partnerInfo.display_name} are connected. Let's set up your couple profile with a quick quiz.`
                : "Let's learn about you both to personalize your experience."
              }
            </p>
          </div>
        )}

        {/* Step 1: Gender */}
        {step === 1 && <SelectionGrid options={GENDER_OPTIONS} selected={gender} onSelect={setGender} testPrefix="gender" />}

        {/* Step 2: Partner Gender */}
        {step === 2 && <SelectionGrid options={GENDER_OPTIONS} selected={partnerGender} onSelect={setPartnerGender} testPrefix="partner-gender" />}

        {/* Step 3: Ethnicity */}
        {step === 3 && <SelectionGrid options={ETHNICITY_OPTIONS} selected={ethnicity} onSelect={setEthnicity} testPrefix="ethnicity" />}

        {/* Step 4: Partner Zodiac */}
        {step === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing[2] }}>
            {ZODIAC_OPTIONS.map((z) => (
              <button key={z.key} data-testid={`partner-zodiac-${z.key}`} onClick={() => setPartnerZodiac(z.key)}
                style={{
                  padding: theme.spacing[3], borderRadius: theme.radius.none,
                  border: partnerZodiac === z.key ? '2px solid #9D4EDD' : '1px solid #1F1F1F',
                  background: partnerZodiac === z.key ? 'rgba(157,78,221,0.08)' : 'transparent',
                  cursor: 'pointer', textAlign: 'center',
                }}>
                <span style={{ fontSize: '22px', display: 'block' }}>{z.symbol}</span>
                <span style={{ fontSize: theme.typography.size.xs, fontWeight: 600, color: partnerZodiac === z.key ? '#9D4EDD' : '#FFF', display: 'block', marginTop: '2px' }}>{z.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Personality questions */}
        {step >= personalityStart && step < relationshipStart && (() => {
          const qi = step - personalityStart;
          const pq = PERSONALITY_QUESTIONS[qi];
          const answered = personalityAnswers[qi];
          return (
            <div>
              <p style={{ fontSize: theme.typography.size.lg, color: '#FFF', fontWeight: 600, marginBottom: theme.spacing[4], lineHeight: 1.4 }}>{pq.q}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                {['a', 'b'].map((key) => (
                  <button key={key} data-testid={`personality-${qi}-${key}`}
                    onClick={() => {
                      const newAnswers = [...personalityAnswers];
                      newAnswers[qi] = key;
                      setPersonalityAnswers(newAnswers);
                    }}
                    style={{
                      width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.none, textAlign: 'left',
                      border: answered === key ? '2px solid #D4AF37' : '1px solid #1F1F1F',
                      background: answered === key ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)',
                      color: answered === key ? '#D4AF37' : '#FFF',
                      fontSize: theme.typography.size.md, fontWeight: answered === key ? 700 : 500, cursor: 'pointer',
                    }}>
                    {pq[key]}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Relationship questions */}
        {step >= relationshipStart && (() => {
          const qi = step - relationshipStart;
          const rq = RELATIONSHIP_QUESTIONS[qi];
          const answered = relationshipAnswers[qi];
          return (
            <div>
              <p style={{ fontSize: theme.typography.size.lg, color: '#FFF', fontWeight: 600, marginBottom: theme.spacing[4], lineHeight: 1.4 }}>{rq.q}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                {rq.opts.map((opt, oi) => (
                  <button key={oi} data-testid={`relationship-${qi}-${oi}`}
                    onClick={() => {
                      const newAnswers = [...relationshipAnswers];
                      newAnswers[qi] = opt;
                      setRelationshipAnswers(newAnswers);
                    }}
                    style={{
                      width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.none, textAlign: 'left',
                      border: answered === opt ? '2px solid #9D4EDD' : '1px solid #1F1F1F',
                      background: answered === opt ? 'rgba(157,78,221,0.1)' : 'rgba(255,255,255,0.02)',
                      color: answered === opt ? '#9D4EDD' : '#FFF',
                      fontSize: theme.typography.size.md, fontWeight: answered === opt ? 700 : 500, cursor: 'pointer',
                    }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing[6], gap: theme.spacing[3] }}>
          {step > 0 ? (
            <button data-testid="onboarding-back-btn" onClick={handleBack} style={{
              padding: `${theme.spacing[3]} ${theme.spacing[5]}`, borderRadius: theme.radius.none,
              border: '1px solid #1F1F1F', background: 'transparent',
              color: '#9CA3AF', fontSize: theme.typography.size.md, cursor: 'pointer',
            }}>Back</button>
          ) : <div />}
          <button data-testid="onboarding-next-btn" onClick={handleNext}
            disabled={!canProceed() || loading}
            style={{
              padding: `${theme.spacing[3]} ${theme.spacing[6]}`, borderRadius: theme.radius.none,
              border: 'none',
              background: canProceed() ? (step === totalSteps - 1 ? 'linear-gradient(135deg, #D4AF37, #9D4EDD)' : '#D4AF37') : '#1F1F1F',
              color: canProceed() ? (step === totalSteps - 1 ? '#FFF' : '#000') : '#555',
              fontSize: theme.typography.size.md, fontWeight: 700,
              cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1,
              fontFamily: theme.typography.fontFamily.heading, letterSpacing: '0.05em',
            }}>{loading ? 'Finishing...' : (step === totalSteps - 1 ? 'COMPLETE SETUP' : (step === 0 ? "LET'S GO" : 'NEXT'))}</button>
        </div>
      </div>

      <button data-testid="onboarding-signout-btn" onClick={signOut} style={{
        marginTop: theme.spacing[6], padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
        background: 'transparent', border: 'none', color: '#555',
        fontSize: theme.typography.size.sm, cursor: 'pointer', textDecoration: 'underline',
      }}>Sign out</button>
    </div>
  );
}
