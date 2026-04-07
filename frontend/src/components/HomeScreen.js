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
  const [partnerData, setPartnerData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const t = getThemeColors(mode);

  useEffect(() => {
    loadDailyQuestion();
    loadNotifications();
    loadStreak();
  }, []);

  useEffect(() => {
    if (submitted) loadPartnerAnswer();
  }, [submitted]);

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

  const loadPartnerAnswer = async () => {
    try {
      const { data } = await api.getPartnerAnswer();
      setPartnerData(data);
    } catch (err) {
      console.error('Failed to load partner answer:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data } = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const loadStreak = async () => {
    try {
      const { data } = await api.getStreak();
      setStreak(data);
    } catch (err) {
      console.error('Failed to load streak:', err);
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

        {/* Streak Tracker */}
        {streak && (streak.current_streak > 0 || streak.total_days > 0) && (
          <div data-testid="streak-tracker" style={{
            display: 'flex', alignItems: 'center', gap: theme.spacing[3],
            padding: theme.spacing[3], borderRadius: theme.radius.lg, marginBottom: theme.spacing[4],
            background: mode === 'deeplyus' ? 'rgba(255,255,255,0.06)' : theme.colors.bg.surface,
            boxShadow: mode === 'deeplyus' ? theme.shadow.deep.soft : theme.shadow.card,
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: theme.radius.round, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '22px',
              background: streak.current_streak > 0
                ? `linear-gradient(135deg, #FF6F8F, #FF8FAF)`
                : (mode === 'deeplyus' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
            }}>
              {streak.current_streak > 0 ? '🔥' : '💤'}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.bold, color: t.text.primary,
              }}>
                {streak.current_streak} day streak
              </span>
              <span style={{ fontSize: theme.typography.size.xs, color: t.text.muted, display: 'block' }}>
                Best: {streak.longest_streak} days · {streak.total_days} total
              </span>
            </div>
            <button onClick={() => setView('weekly-report')} style={{
              padding: `${theme.spacing[1]} ${theme.spacing[3]}`, borderRadius: theme.radius.round,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              background: 'transparent', color: t.text.secondary, fontSize: theme.typography.size.xs,
              cursor: 'pointer',
            }}>
              Report
            </button>
          </div>
        )}

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

                  {/* Partner answer sync */}
                  {partnerData?.both_answered && partnerData.partner_answer && (
                    <div data-testid="partner-answer-display" style={{
                      marginTop: theme.spacing[3],
                      padding: theme.spacing[3],
                      borderRadius: theme.radius.md,
                      background: 'rgba(255,255,255,0.15)',
                      borderLeft: `3px solid ${mode === 'deeplyus' ? theme.colors.deep.accent.primary : '#FF8FAF'}`,
                    }}>
                      <span style={{ fontSize: theme.typography.size.xs, color: 'rgba(255,255,255,0.6)', fontWeight: theme.typography.weight.semibold, textTransform: 'uppercase' }}>
                        Partner's Answer
                      </span>
                      <p style={{ fontSize: theme.typography.size.sm, color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary, lineHeight: theme.typography.lineHeight.relaxed, marginTop: theme.spacing[1] }}>
                        {partnerData.partner_answer}
                      </p>
                    </div>
                  )}
                  {partnerData && !partnerData.both_answered && partnerData.partner_answered && (
                    <p style={{ marginTop: theme.spacing[2], fontSize: theme.typography.size.xs, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                      Your partner has answered too! Both answers are now visible.
                    </p>
                  )}
                  {partnerData && !partnerData.partner_answered && (
                    <p style={{ marginTop: theme.spacing[2], fontSize: theme.typography.size.xs, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                      Waiting for your partner to answer...
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div data-testid="notifications-banner" style={{ marginBottom: theme.spacing[4] }}>
            {notifications.map((n, i) => (
              <button
                key={i}
                onClick={() => {
                  if (n.type === 'love_language') setView('love-language');
                  else if (n.type === 'partner_answered' || n.type === 'partner_waiting') {}
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: theme.spacing[3],
                  padding: theme.spacing[3], borderRadius: theme.radius.md, marginBottom: theme.spacing[2],
                  background: mode === 'deeplyus' ? 'rgba(74,108,255,0.15)' : 'rgba(99,102,241,0.08)',
                  border: `1px solid ${mode === 'deeplyus' ? 'rgba(74,108,255,0.3)' : 'rgba(99,102,241,0.15)'}`,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '16px' }}>
                  {n.type === 'love_language' ? '💕' : n.type === 'partner_answered' ? '💌' : '⏳'}
                </span>
                <span style={{ fontSize: theme.typography.size.xs, color: t.text.primary }}>{n.message}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: theme.spacing[3],
        }}>
          <QuickAction icon="✨" label="Horoscope" description="Your daily stars" onClick={() => setView('horoscope')} mode={mode} />
          <QuickAction icon="💬" label="Partner Chat" description="Message them" onClick={() => setView('partner-chat')} mode={mode} />
          <QuickAction icon="💕" label="Love Language" description="Know your style" onClick={() => setView('love-language')} mode={mode} />
          <QuickAction icon="🎵" label="Our Playlist" description="Shared music" onClick={() => setView('playlist')} mode={mode} />
          <QuickAction icon="🎨" label="Portraits" description="AI couple art" onClick={() => setView('portraits')} mode={mode} />
          <QuickAction icon="📌" label="Timeline" description="Our milestones" onClick={() => setView('milestones')} mode={mode} />
          <QuickAction icon="🌙" label="Astrology" description="Cosmic blueprint" onClick={() => setView('astrology')} mode={mode} />
          <QuickAction icon="📊" label="Weekly Report" description="Relationship pulse" onClick={() => setView('weekly-report')} mode={mode} />
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
