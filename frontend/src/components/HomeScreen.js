import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function HomeScreen() {
  const { profile } = useAuth();
  const { mode, setView } = useApp();
  const [dailyQuestion, setDailyQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const t = getThemeColors(mode);

  useEffect(() => {
    loadDailyQuestion();
  }, []);

  const loadDailyQuestion = async () => {
    try {
      const { data } = await api.getDailyQuestion();
      setDailyQuestion(data);
      if (data.answer) {
        setAnswer(data.answer);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to load daily question:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    
    try {
      await api.answerDailyQuestion(answer);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const categoryColors = {
    deep: '#8B5CF6',
    fun: '#F59E0B',
    growth: '#10B981',
    trust: '#EC4899',
    intimacy: '#EF4444',
    values: '#3B82F6',
    reflection: '#6366F1',
    future: '#14B8A6',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
      padding: theme.spacing[4],
      paddingBottom: '100px',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: theme.spacing[6] }}>
          <h1 style={{
            fontSize: theme.typography.size.display,
            fontWeight: theme.typography.weight.bold,
            color: t.text.primary,
            marginBottom: theme.spacing[1],
          }}>
            {profile?.display_name ? `Hey, ${profile.display_name}` : 'CommonGround'}
          </h1>
          <p style={{
            fontSize: theme.typography.size.sm,
            color: t.text.muted,
          }}>
            Powered by BentlyAI
          </p>
        </div>

        {/* Daily Question Card */}
        <div data-testid="daily-question-card" style={{
          background: mode === 'deeplyus' 
            ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})`
            : `linear-gradient(135deg, ${theme.colors.gradient.emotional.start}, ${theme.colors.gradient.emotional.end})`,
          borderRadius: theme.radius.xl,
          padding: theme.spacing[6],
          boxShadow: mode === 'deeplyus' ? theme.shadow.deep.glow : theme.shadow.card,
          marginBottom: theme.spacing[5],
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
            <span style={{
              padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
              borderRadius: theme.radius.round,
              background: 'rgba(255,255,255,0.3)',
              fontSize: theme.typography.size.xs,
              fontWeight: theme.typography.weight.bold,
              color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
              textTransform: 'uppercase',
            }}>
              Daily Question
            </span>
            {dailyQuestion?.category && (
              <span style={{
                padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                borderRadius: theme.radius.round,
                background: categoryColors[dailyQuestion.category] || t.accent.primary,
                fontSize: theme.typography.size.xs,
                fontWeight: theme.typography.weight.medium,
                color: '#FFFFFF',
                textTransform: 'capitalize',
              }}>
                {dailyQuestion.category}
              </span>
            )}
          </div>

          {loading ? (
            <p style={{ color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary }}>Loading...</p>
          ) : (
            <>
              <p style={{
                fontSize: theme.typography.size.xl,
                fontWeight: theme.typography.weight.semibold,
                lineHeight: theme.typography.lineHeight.relaxed,
                color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
                marginBottom: theme.spacing[5],
              }}>
                {dailyQuestion?.question || "What's one thing you're grateful for today?"}
              </p>

              {!submitted ? (
                <div>
                  <textarea
                    data-testid="daily-answer-input"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: theme.spacing[4],
                      borderRadius: theme.radius.lg,
                      border: 'none',
                      background: 'rgba(255,255,255,0.2)',
                      color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
                      fontSize: theme.typography.size.md,
                      resize: 'none',
                      outline: 'none',
                      fontFamily: theme.typography.fontFamily.primary,
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    data-testid="submit-answer-btn"
                    onClick={handleSubmitAnswer}
                    disabled={!answer.trim()}
                    style={{
                      marginTop: theme.spacing[3],
                      padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
                      borderRadius: theme.radius.round,
                      border: 'none',
                      background: !answer.trim() ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                      color: !answer.trim() ? 'rgba(255,255,255,0.5)' : theme.colors.text.primary,
                      fontSize: theme.typography.size.sm,
                      fontWeight: theme.typography.weight.semibold,
                      cursor: answer.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Submit Answer
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: theme.spacing[4],
                  borderRadius: theme.radius.lg,
                  background: 'rgba(255,255,255,0.2)',
                }}>
                  <p style={{
                    fontSize: theme.typography.size.xs,
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: theme.spacing[2],
                    textTransform: 'uppercase',
                    fontWeight: theme.typography.weight.semibold,
                  }}>
                    Your answer
                  </p>
                  <p style={{
                    fontSize: theme.typography.size.md,
                    color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
                    lineHeight: theme.typography.lineHeight.relaxed,
                  }}>
                    {answer}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: theme.spacing[3],
        }}>
          <QuickAction 
            icon="✨" 
            label="Horoscope" 
            description="Your daily stars"
            onClick={() => setView('horoscope')}
            mode={mode}
          />
          <QuickAction 
            icon="💜" 
            label="Trust" 
            description="Build together"
            onClick={() => setView('trust')}
            mode={mode}
          />
          <QuickAction 
            icon="🎵" 
            label="Favorites" 
            description="Share what you love"
            onClick={() => setView('favorites')}
            mode={mode}
          />
          <QuickAction 
            icon="💬" 
            label="Chat" 
            description="Talk to BentlyAI"
            onClick={() => setView('chat')}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, description, onClick, mode }) {
  const t = getThemeColors(mode);
  
  return (
    <button
      onClick={onClick}
      style={{
        padding: theme.spacing[4],
        borderRadius: theme.radius.lg,
        border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
        textAlign: 'left',
        cursor: 'pointer',
        transition: `all ${theme.motion.duration.fast}`,
      }}
    >
      <span style={{ fontSize: '24px', display: 'block', marginBottom: theme.spacing[2] }}>{icon}</span>
      <span style={{
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: t.text.primary,
        display: 'block',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: theme.typography.size.xs,
        color: t.text.muted,
      }}>
        {description}
      </span>
    </button>
  );
}
