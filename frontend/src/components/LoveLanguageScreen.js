import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function LoveLanguageScreen() {
  const { refreshProfile } = useAuth();
  const { mode } = useApp();
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const t = getThemeColors(mode);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quizRes, resultsRes] = await Promise.all([
        api.getLoveLanguageQuiz(),
        api.getLoveLanguageResults(),
      ]);
      setQuestions(quizRes.data.questions || []);
      if (resultsRes.data.completed) {
        setResults(resultsRes.data);
      }
    } catch (err) {
      console.error('Failed to load quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (lang) => {
    const newAnswers = [...answers, lang];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    setSubmitting(true);
    try {
      const { data } = await api.submitLoveLanguage(finalAnswers);
      setResults({
        completed: true,
        scores: data.scores,
        primary: data.primary,
        primary_label: data.primary_label,
        secondary: data.secondary,
        secondary_label: data.secondary_label,
        labels: {
          words_of_affirmation: "Words of Affirmation",
          acts_of_service: "Acts of Service",
          receiving_gifts: "Receiving Gifts",
          quality_time: "Quality Time",
          physical_touch: "Physical Touch",
        },
      });
      await refreshProfile();
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResults(null);
    setCurrentQ(0);
    setAnswers([]);
  };

  const langDescriptions = {
    words_of_affirmation: "You feel most loved through verbal compliments, 'I love you's, and words of encouragement.",
    acts_of_service: "You feel most loved when your partner does thoughtful things to make your life easier.",
    receiving_gifts: "You feel most loved through visual symbols of love — thoughtful gifts that show they were thinking of you.",
    quality_time: "You feel most loved through undivided attention and meaningful shared experiences.",
    physical_touch: "You feel most loved through physical closeness — hugs, holding hands, and affectionate touch.",
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg.primary, fontFamily: theme.typography.fontFamily.primary }}>
        <p style={{ color: t.text.muted }}>Loading...</p>
      </div>
    );
  }

  // Results view
  if (results) {
    const maxScore = Math.max(...Object.values(results.scores || {}));
    return (
      <div data-testid="love-language-results" style={{
        minHeight: '100vh',
        background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
        padding: theme.spacing[4],
        paddingBottom: '100px',
        fontFamily: theme.typography.fontFamily.primary,
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h1 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, marginBottom: theme.spacing[2] }}>
            Your Love Language
          </h1>
          <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted, marginBottom: theme.spacing[5] }}>
            How BentlyAI personalizes advice for you
          </p>

          {/* Primary result card */}
          <div style={{
            background: `linear-gradient(135deg, ${mode === 'deeplyus' ? theme.colors.deep.gradient.start : theme.colors.gradient.emotional.start}, ${mode === 'deeplyus' ? theme.colors.deep.gradient.end : theme.colors.gradient.emotional.end})`,
            borderRadius: theme.radius.xl, padding: theme.spacing[6], marginBottom: theme.spacing[5],
            boxShadow: mode === 'deeplyus' ? theme.shadow.deep.glow : theme.shadow.card,
          }}>
            <span style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Primary Love Language
            </span>
            <h2 style={{ fontSize: theme.typography.size.display, fontWeight: theme.typography.weight.bold, color: '#FFFFFF', margin: `${theme.spacing[2]} 0` }}>
              {results.primary_label}
            </h2>
            <p style={{ fontSize: theme.typography.size.sm, color: 'rgba(255,255,255,0.85)', lineHeight: theme.typography.lineHeight.relaxed }}>
              {langDescriptions[results.primary]}
            </p>
          </div>

          {/* All scores */}
          <div style={{ background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface, borderRadius: theme.radius.lg, padding: theme.spacing[4], marginBottom: theme.spacing[4] }}>
            <h3 style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', marginBottom: theme.spacing[4] }}>
              Full Breakdown
            </h3>
            {Object.entries(results.scores || {}).sort((a, b) => b[1] - a[1]).map(([lang, score]) => (
              <div key={lang} style={{ marginBottom: theme.spacing[3] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing[1] }}>
                  <span style={{ fontSize: theme.typography.size.sm, color: t.text.primary, fontWeight: lang === results.primary ? theme.typography.weight.bold : theme.typography.weight.regular }}>
                    {results.labels?.[lang] || lang}
                  </span>
                  <span style={{ fontSize: theme.typography.size.xs, color: t.text.muted }}>{score}/15</span>
                </div>
                <div style={{ height: '6px', borderRadius: theme.radius.round, background: mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                  <div style={{
                    height: '100%', borderRadius: theme.radius.round,
                    width: `${maxScore > 0 ? (score / maxScore) * 100 : 0}%`,
                    background: lang === results.primary ? t.accent.primary : (mode === 'deeplyus' ? 'rgba(255,143,175,0.5)' : 'rgba(255,111,174,0.4)'),
                    transition: `width ${theme.motion.duration.slow}`,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Partner results */}
          {results.partner && (
            <div style={{ background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface, borderRadius: theme.radius.lg, padding: theme.spacing[4], marginBottom: theme.spacing[4] }}>
              <h3 style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', marginBottom: theme.spacing[2] }}>
                Your Partner's Primary
              </h3>
              <p style={{ fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.semibold, color: t.accent.primary }}>
                {results.partner.primary_label}
              </p>
            </div>
          )}

          <button data-testid="retake-quiz-btn" onClick={handleRetake} style={{
            width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md,
            border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            background: 'transparent', color: t.text.secondary, fontSize: theme.typography.size.sm, cursor: 'pointer',
          }}>
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz view
  const q = questions[currentQ];
  if (!q) return null;

  return (
    <div data-testid="love-language-quiz" style={{
      minHeight: '100vh',
      background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing[6], fontFamily: theme.typography.fontFamily.primary,
    }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: theme.spacing[5], width: '100%', maxWidth: '400px' }}>
        {questions.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: theme.radius.round,
            background: i <= currentQ ? t.accent.primary : (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
            transition: `background ${theme.motion.duration.fast}`,
          }} />
        ))}
      </div>

      <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted, marginBottom: theme.spacing[2] }}>
        Question {currentQ + 1} of {questions.length}
      </p>
      <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, marginBottom: theme.spacing[6], textAlign: 'center' }}>
        Which feels more like love?
      </h2>

      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <button
          data-testid="quiz-option-a"
          onClick={() => handleAnswer(q.a.lang)}
          disabled={submitting}
          style={{
            padding: theme.spacing[5], borderRadius: theme.radius.lg,
            border: `2px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
            background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
            color: t.text.primary, fontSize: theme.typography.size.md, textAlign: 'left',
            cursor: 'pointer', lineHeight: theme.typography.lineHeight.relaxed,
            transition: `all ${theme.motion.duration.fast}`, fontFamily: theme.typography.fontFamily.primary,
          }}
        >
          {q.a.text}
        </button>
        <button
          data-testid="quiz-option-b"
          onClick={() => handleAnswer(q.b.lang)}
          disabled={submitting}
          style={{
            padding: theme.spacing[5], borderRadius: theme.radius.lg,
            border: `2px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
            background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
            color: t.text.primary, fontSize: theme.typography.size.md, textAlign: 'left',
            cursor: 'pointer', lineHeight: theme.typography.lineHeight.relaxed,
            transition: `all ${theme.motion.duration.fast}`, fontFamily: theme.typography.fontFamily.primary,
          }}
        >
          {q.b.text}
        </button>
      </div>

      {submitting && <p style={{ marginTop: theme.spacing[4], color: t.text.muted }}>Calculating your love language...</p>}
    </div>
  );
}
