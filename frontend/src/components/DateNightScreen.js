import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

const MOODS = [
  { key: 'romantic', label: 'Romantic', icon: '💘' },
  { key: 'adventurous', label: 'Adventurous', icon: '🌟' },
  { key: 'cozy', label: 'Cozy', icon: '🕯️' },
  { key: 'creative', label: 'Creative', icon: '🎨' },
  { key: 'surprise', label: 'Surprise Me', icon: '🎲' },
];

const BUDGETS = [
  { key: 'free', label: 'Free' },
  { key: 'low', label: '$' },
  { key: 'medium', label: '$$' },
  { key: 'high', label: '$$$' },
];

const LOCATIONS = [
  { key: 'home', label: 'At Home' },
  { key: 'nearby', label: 'Nearby' },
  { key: 'anywhere', label: 'Anywhere' },
];

export default function DateNightScreen() {
  const { mode } = useApp();
  const [mood, setMood] = useState('romantic');
  const [budget, setBudget] = useState('medium');
  const [location, setLocation] = useState('home');
  const [dateIdea, setDateIdea] = useState(null);
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const t = getThemeColors(mode);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const { data } = await api.getDateNightHistory();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setDateIdea(null);
    try {
      const { data } = await api.generateDateNight(mood, budget, location);
      setDateIdea(data.date_night);
      loadHistory();
    } catch (err) {
      console.error('Failed to generate:', err);
    } finally {
      setGenerating(false);
    }
  };

  const chipStyle = (selected) => ({
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.round,
    border: selected
      ? `2px solid ${t.accent.primary}`
      : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
    background: selected
      ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.15)' : 'rgba(255,111,174,0.08)')
      : 'transparent',
    color: selected ? t.accent.primary : t.text.secondary,
    fontSize: theme.typography.size.sm,
    fontWeight: selected ? theme.typography.weight.semibold : theme.typography.weight.regular,
    cursor: 'pointer', whiteSpace: 'nowrap',
  });

  return (
    <div data-testid="date-night-screen" style={{
      minHeight: '100vh',
      background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
      padding: theme.spacing[4], paddingBottom: '100px',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing[5] }}>
          <div>
            <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, margin: 0 }}>
              Date Night
            </h2>
            <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted, margin: 0 }}>
              Personalized by BentlyAI
            </p>
          </div>
          {history.length > 0 && (
            <button
              data-testid="toggle-history-btn"
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: `${theme.spacing[2]} ${theme.spacing[3]}`, borderRadius: theme.radius.round,
                border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                background: 'transparent', color: t.text.secondary, fontSize: theme.typography.size.xs, cursor: 'pointer',
              }}
            >
              {showHistory ? 'New Idea' : `History (${history.length})`}
            </button>
          )}
        </div>

        {!showHistory && (
          <>
            {/* Mood selector */}
            <div style={{ marginBottom: theme.spacing[4] }}>
              <label style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: theme.spacing[2] }}>
                Mood
              </label>
              <div style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
                {MOODS.map((m) => (
                  <button key={m.key} data-testid={`mood-${m.key}`} onClick={() => setMood(m.key)} style={chipStyle(mood === m.key)}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div style={{ marginBottom: theme.spacing[4] }}>
              <label style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: theme.spacing[2] }}>
                Budget
              </label>
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                {BUDGETS.map((b) => (
                  <button key={b.key} data-testid={`budget-${b.key}`} onClick={() => setBudget(b.key)} style={chipStyle(budget === b.key)}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: theme.spacing[5] }}>
              <label style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: theme.spacing[2] }}>
                Location
              </label>
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                {LOCATIONS.map((l) => (
                  <button key={l.key} data-testid={`location-${l.key}`} onClick={() => setLocation(l.key)} style={chipStyle(location === l.key)}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              data-testid="generate-date-night-btn"
              onClick={handleGenerate}
              disabled={generating}
              style={{
                width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.lg, border: 'none',
                background: generating
                  ? (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                  : `linear-gradient(135deg, ${t.accent.primary}, ${t.accent.secondary || t.accent.primary})`,
                color: generating ? t.text.muted : '#FFFFFF',
                fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.bold,
                cursor: generating ? 'not-allowed' : 'pointer',
                boxShadow: generating ? 'none' : (mode === 'deeplyus' ? theme.shadow.deep.glow : theme.shadow.card),
                marginBottom: theme.spacing[5],
              }}
            >
              {generating ? 'BentlyAI is planning...' : 'Plan Our Date Night'}
            </button>

            {/* Result */}
            {dateIdea && <DateIdeaCard idea={dateIdea} mode={mode} t={t} />}
          </>
        )}

        {/* History */}
        {showHistory && (
          <div>
            {history.map((entry) => (
              <div key={entry.id} style={{ marginBottom: theme.spacing[4] }}>
                <span style={{ fontSize: theme.typography.size.xs, color: t.text.muted }}>
                  {new Date(entry.created_at).toLocaleDateString()} — {entry.mood}, {entry.budget}, {entry.location}
                </span>
                <DateIdeaCard idea={entry.idea} mode={mode} t={t} compact />
              </div>
            ))}
            {history.length === 0 && <p style={{ color: t.text.muted, textAlign: 'center' }}>No history yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function DateIdeaCard({ idea, mode, t, compact }) {
  if (!idea) return null;

  return (
    <div data-testid="date-idea-card" style={{
      borderRadius: theme.radius.xl, overflow: 'hidden',
      background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
      boxShadow: mode === 'deeplyus' ? theme.shadow.deep.soft : theme.shadow.card,
      border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}`,
    }}>
      {/* Header */}
      <div style={{
        padding: theme.spacing[4],
        background: `linear-gradient(135deg, ${mode === 'deeplyus' ? theme.colors.deep.gradient.start : theme.colors.gradient.emotional.start}, ${mode === 'deeplyus' ? theme.colors.deep.gradient.end : theme.colors.gradient.emotional.end})`,
      }}>
        <h3 style={{ fontSize: compact ? theme.typography.size.md : theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: '#FFFFFF', margin: 0 }}>
          {idea.title || 'Your Date Night'}
        </h3>
        {idea.estimated_time && (
          <span style={{ fontSize: theme.typography.size.xs, color: 'rgba(255,255,255,0.7)' }}>{idea.estimated_time}</span>
        )}
      </div>

      <div style={{ padding: theme.spacing[4] }}>
        {/* Description */}
        {idea.description && (
          <p style={{ fontSize: theme.typography.size.sm, color: t.text.primary, lineHeight: theme.typography.lineHeight.relaxed, marginBottom: theme.spacing[4] }}>
            {idea.description}
          </p>
        )}

        {/* Steps */}
        {idea.steps && idea.steps.length > 0 && (
          <div style={{ marginBottom: theme.spacing[4] }}>
            <h4 style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', marginBottom: theme.spacing[2] }}>
              Game Plan
            </h4>
            {idea.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: theme.spacing[2], marginBottom: theme.spacing[2] }}>
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  background: mode === 'deeplyus' ? 'rgba(255,143,175,0.2)' : 'rgba(255,111,174,0.1)',
                  color: t.accent.primary, fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {i + 1}
                </span>
                <p style={{ fontSize: theme.typography.size.xs, color: t.text.secondary, margin: 0, lineHeight: theme.typography.lineHeight.relaxed }}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Extras grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing[2] }}>
          {idea.food_idea && (
            <div style={{ padding: theme.spacing[3], borderRadius: theme.radius.md, background: mode === 'deeplyus' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '10px', fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase' }}>Food/Drink</span>
              <p style={{ fontSize: theme.typography.size.xs, color: t.text.primary, margin: `${theme.spacing[1]} 0 0` }}>{idea.food_idea}</p>
            </div>
          )}
          {idea.conversation_starter && (
            <div style={{ padding: theme.spacing[3], borderRadius: theme.radius.md, background: mode === 'deeplyus' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '10px', fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase' }}>Ask This</span>
              <p style={{ fontSize: theme.typography.size.xs, color: t.text.primary, margin: `${theme.spacing[1]} 0 0`, fontStyle: 'italic' }}>"{idea.conversation_starter}"</p>
            </div>
          )}
        </div>

        {/* Playlist suggestion */}
        {idea.playlist_suggestion && idea.playlist_suggestion.length > 0 && (
          <div style={{ marginTop: theme.spacing[3], padding: theme.spacing[3], borderRadius: theme.radius.md, background: mode === 'deeplyus' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '10px', fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase' }}>Playlist</span>
            {idea.playlist_suggestion.map((song, i) => (
              <p key={i} style={{ fontSize: theme.typography.size.xs, color: t.text.secondary, margin: `${theme.spacing[1]} 0 0` }}>
                {typeof song === 'string' ? song : `${song.title || song}`}
              </p>
            ))}
          </div>
        )}

        {/* Why this works */}
        {idea.why_this_works && (
          <div style={{
            marginTop: theme.spacing[3], padding: theme.spacing[3], borderRadius: theme.radius.md,
            background: mode === 'deeplyus' ? 'rgba(74,108,255,0.1)' : 'rgba(99,102,241,0.06)',
            border: `1px solid ${mode === 'deeplyus' ? 'rgba(74,108,255,0.2)' : 'rgba(99,102,241,0.1)'}`,
          }}>
            <span style={{ fontSize: '10px', fontWeight: theme.typography.weight.bold, color: t.accent.secondary || t.accent.primary, textTransform: 'uppercase' }}>Why This Works for You</span>
            <p style={{ fontSize: theme.typography.size.xs, color: t.text.primary, margin: `${theme.spacing[1]} 0 0` }}>{idea.why_this_works}</p>
          </div>
        )}
      </div>
    </div>
  );
}
