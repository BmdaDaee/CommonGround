import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';
import Marquee from 'react-fast-marquee';
import { motion } from 'framer-motion';
import { Star, ChatCircle, Heart, MusicNote, Palette, MapPin, Moon, ChartBar, Wine, Fire, PaperPlaneTilt } from '@phosphor-icons/react';

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

  useEffect(() => { if (submitted) loadPartnerAnswer(); }, [submitted]);

  const loadDailyQuestion = async () => {
    try {
      const { data } = await api.getDailyQuestion();
      setDailyQuestion(data);
      if (data.answer) { setAnswer(data.answer); setSubmitted(true); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadPartnerAnswer = async () => {
    try { const { data } = await api.getPartnerAnswer(); setPartnerData(data); } catch (err) {}
  };

  const loadNotifications = async () => {
    try { const { data } = await api.getNotifications(); setNotifications(data.notifications || []); } catch (err) {}
  };

  const loadStreak = async () => {
    try { const { data } = await api.getStreak(); setStreak(data); } catch (err) {}
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    try {
      await api.answerDailyQuestion(answer.trim());
      setSubmitted(true);
    } catch (err) { console.error(err); }
  };

  const actions = [
    { icon: Star, label: 'HOROSCOPE', view: 'horoscope', color: '#FFE600' },
    { icon: PaperPlaneTilt, label: 'PARTNER', view: 'partner-chat', color: '#FF3333' },
    { icon: Heart, label: 'LOVE LANG', view: 'love-language', color: '#FF0066' },
    { icon: MusicNote, label: 'PLAYLIST', view: 'playlist', color: '#00FF88' },
    { icon: Palette, label: 'PORTRAITS', view: 'portraits', color: '#FFE600' },
    { icon: MapPin, label: 'TIMELINE', view: 'milestones', color: '#FF3333' },
    { icon: Moon, label: 'ASTROLOGY', view: 'astrology', color: '#8B5CF6' },
    { icon: ChartBar, label: 'REPORT', view: 'weekly-report', color: '#00FF88' },
    { icon: Wine, label: 'DATE NIGHT', view: 'date-night', color: '#FF0066' },
  ];

  return (
    <div data-testid="home-screen" style={{
      minHeight: '100vh', background: '#050505', paddingBottom: '100px',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      {/* Background marquee */}
      <div style={{ position: 'fixed', top: '50%', left: 0, right: 0, zIndex: 0, opacity: 0.03, pointerEvents: 'none', transform: 'translateY(-50%) rotate(-5deg)' }}>
        <Marquee speed={30} gradient={false}>
          <span style={{ fontSize: '120px', fontFamily: theme.typography.fontFamily.heading, fontWeight: 900, color: '#FFF', letterSpacing: '-0.05em', marginRight: '64px' }}>
            COMMONGROUND COMMONGROUND COMMONGROUND
          </span>
        </Marquee>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', padding: `${theme.spacing[6]} ${theme.spacing[4]}` }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.2em', color: '#FF3333', textTransform: 'uppercase', fontFamily: theme.typography.fontFamily.heading, marginBottom: theme.spacing[1] }}>
            WELCOME BACK
          </p>
          <h1 style={{
            fontSize: theme.typography.size.hero, fontWeight: 900,
            fontFamily: theme.typography.fontFamily.heading, color: '#FFF',
            letterSpacing: '-0.03em', lineHeight: 1.0, marginBottom: theme.spacing[4],
          }}>
            {profile?.display_name || 'You'}
          </h1>
        </motion.div>

        {/* Streak */}
        {streak && (streak.current_streak > 0 || streak.total_days > 0) && (
          <motion.div data-testid="streak-tracker" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: theme.spacing[3],
              padding: theme.spacing[3], marginBottom: theme.spacing[4],
              background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.2)',
              borderRadius: theme.radius.none,
            }}
          >
            <Fire size={28} weight="fill" color="#FF3333" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: theme.typography.size.lg, fontWeight: 800, color: '#FF3333', fontFamily: theme.typography.fontFamily.heading }}>
                {streak.current_streak}
              </span>
              <span style={{ fontSize: theme.typography.size.sm, color: '#8A8A93', marginLeft: theme.spacing[2] }}>
                day streak
              </span>
            </div>
            <button onClick={() => setView('weekly-report')} style={{
              padding: `${theme.spacing[1]} ${theme.spacing[3]}`, background: 'transparent',
              border: '1px solid #333', color: '#8A8A93', fontSize: theme.typography.size.xs,
              fontWeight: 700, cursor: 'pointer', fontFamily: theme.typography.fontFamily.heading,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              REPORT
            </button>
          </motion.div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div data-testid="notifications-banner" style={{ marginBottom: theme.spacing[4] }}>
            {notifications.map((n, i) => (
              <button key={i} onClick={() => { if (n.type === 'love_language') setView('love-language'); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: theme.spacing[3],
                  padding: theme.spacing[3], marginBottom: theme.spacing[2],
                  background: 'rgba(255,230,0,0.06)', border: '1px solid rgba(255,230,0,0.15)',
                  borderRadius: theme.radius.none, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: theme.typography.size.xs, color: '#FFE600', fontWeight: 600 }}>{n.message}</span>
              </button>
            ))}
          </div>
        )}

        {/* Daily Question */}
        <motion.div data-testid="daily-question-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            padding: theme.spacing[6], marginBottom: theme.spacing[6],
            background: 'linear-gradient(135deg, rgba(255,51,51,0.12), rgba(255,0,102,0.08))',
            border: '1px solid rgba(255,51,51,0.2)',
            borderRadius: theme.radius.none,
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Red glow corner */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(255,51,51,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <span style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.2em', color: '#FF3333', textTransform: 'uppercase', fontFamily: theme.typography.fontFamily.heading }}>
            {dailyQuestion?.category || 'DAILY SPARK'}
          </span>
          <h2 style={{
            fontSize: theme.typography.size.xl, fontWeight: 700, color: '#FFF',
            lineHeight: theme.typography.lineHeight.normal, margin: `${theme.spacing[3]} 0`,
            fontFamily: theme.typography.fontFamily.heading,
          }}>
            {loading ? '...' : (dailyQuestion?.question || 'Loading your question...')}
          </h2>

          {!submitted ? (
            <div style={{ display: 'flex', gap: theme.spacing[2] }}>
              <input
                data-testid="daily-answer-input"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                placeholder="Your answer..."
                style={{
                  flex: 1, padding: theme.spacing[3],
                  background: 'rgba(255,255,255,0.05)', border: '1px solid #333',
                  borderRadius: theme.radius.none, color: '#FFF',
                  fontSize: theme.typography.size.sm, outline: 'none',
                  fontFamily: theme.typography.fontFamily.primary,
                }}
              />
              <button data-testid="daily-submit-btn" onClick={handleSubmitAnswer}
                style={{
                  padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
                  background: '#FF3333', border: 'none', color: '#000',
                  fontSize: theme.typography.size.sm, fontWeight: 800,
                  fontFamily: theme.typography.fontFamily.heading,
                  letterSpacing: '0.1em', cursor: 'pointer',
                  transition: `transform ${theme.motion.duration.fast}`,
                }}
              >
                SEND
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: theme.typography.size.md, color: '#FFF', lineHeight: theme.typography.lineHeight.relaxed }}>
                {answer}
              </p>
              {partnerData?.both_answered && partnerData.partner_answer && (
                <div data-testid="partner-answer-display" style={{
                  marginTop: theme.spacing[3], padding: theme.spacing[3],
                  borderLeft: '3px solid #FFE600', background: 'rgba(255,230,0,0.06)',
                }}>
                  <span style={{ fontSize: theme.typography.size.xs, color: '#FFE600', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>PARTNER</span>
                  <p style={{ fontSize: theme.typography.size.sm, color: '#FFF', marginTop: theme.spacing[1] }}>{partnerData.partner_answer}</p>
                </div>
              )}
              {partnerData && !partnerData.partner_answered && (
                <p style={{ marginTop: theme.spacing[2], fontSize: theme.typography.size.xs, color: '#555560', fontStyle: 'italic' }}>
                  Waiting for your partner...
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Quick Actions — Bento grid */}
        <div style={{ marginBottom: theme.spacing[4] }}>
          <p style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.2em', color: '#555560', textTransform: 'uppercase', fontFamily: theme.typography.fontFamily.heading, marginBottom: theme.spacing[3] }}>
            QUICK ACCESS
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: theme.spacing[2],
          }}>
            {actions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.view}
                  data-testid={`quick-action-${action.view}`}
                  onClick={() => setView(action.view)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  whileHover={{ y: -2, boxShadow: `4px 4px 0px ${action.color}` }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: theme.spacing[3], gap: theme.spacing[2],
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #222',
                    borderRadius: theme.radius.none,
                    cursor: 'pointer', textAlign: 'left',
                    transition: `all ${theme.motion.duration.fast}`,
                  }}
                >
                  <Icon size={20} weight="bold" color={action.color} />
                  <span style={{
                    fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em',
                    color: '#8A8A93', fontFamily: theme.typography.fontFamily.heading,
                  }}>
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
