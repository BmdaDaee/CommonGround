import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import theme from '../lib/theme';
import { motion } from 'framer-motion';
import { Palette, SpinnerGap, Plus } from '@phosphor-icons/react';

const THEMES = [
  { key: 'romantic', label: 'Romantic Evening' },
  { key: 'adventure', label: 'Adventure & Travel' },
  { key: 'cozy', label: 'Cozy Night In' },
  { key: 'celebration', label: 'Celebration' },
  { key: 'nostalgia', label: 'Nostalgia' },
  { key: 'future', label: 'Our Future' },
  { key: 'passion', label: 'Passion' },
  { key: 'custom', label: 'Custom...' },
];

const STYLES = [
  { key: 'collage', label: 'Collage' },
  { key: 'watercolor', label: 'Watercolor' },
  { key: 'anime', label: 'Anime' },
  { key: 'cinematic', label: 'Cinematic' },
  { key: 'abstract', label: 'Abstract' },
];

export default function MoodBoardScreen() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('collage');

  useEffect(() => { loadBoards(); }, []);

  const loadBoards = async () => {
    try {
      const { data } = await api.getMoodBoards();
      setBoards(data.boards || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    const t = selectedTheme === 'custom' ? customTheme.trim() : selectedTheme;
    if (!t) return;
    setGenerating(true);
    try {
      const { data } = await api.generateMoodBoard(t, selectedStyle);
      setBoards(prev => [data.board, ...prev]);
      setShowForm(false);
      setSelectedTheme('');
      setCustomTheme('');
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const canGenerate = selectedTheme && (selectedTheme !== 'custom' || customTheme.trim());

  return (
    <div data-testid="mood-board-screen" style={{
      padding: theme.spacing[4], paddingBottom: '100px', maxWidth: '600px', margin: '0 auto',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[5] }}>
        <div>
          <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: 900, color: '#FFF', margin: 0, fontFamily: theme.typography.fontFamily.heading }}>
            Mood Boards
          </h2>
          <p style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF', margin: 0 }}>
            AI-generated visual vibes for you two
          </p>
        </div>
        <button data-testid="create-mood-board-btn" onClick={() => setShowForm(!showForm)} style={{
          padding: `${theme.spacing[2]} ${theme.spacing[4]}`, borderRadius: theme.radius.none,
          border: 'none', background: '#D4AF37', color: '#000',
          fontSize: theme.typography.size.sm, fontWeight: 700, cursor: 'pointer',
          fontFamily: theme.typography.fontFamily.heading,
        }}>
          <Plus size={14} weight="bold" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {showForm ? 'Cancel' : 'Create'}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: theme.spacing[5], marginBottom: theme.spacing[5],
            background: 'rgba(255,255,255,0.02)', border: '1px solid #1F1F1F',
            borderRadius: theme.radius.none,
          }}
        >
          <p style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.15em', color: '#D4AF37', marginBottom: theme.spacing[3], textTransform: 'uppercase' }}>
            Theme
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
            {THEMES.map((t) => (
              <button key={t.key} data-testid={`theme-${t.key}`} onClick={() => setSelectedTheme(t.key)} style={{
                padding: theme.spacing[3], borderRadius: theme.radius.none,
                border: selectedTheme === t.key ? '2px solid #D4AF37' : '1px solid #1F1F1F',
                background: selectedTheme === t.key ? 'rgba(212,175,55,0.1)' : 'transparent',
                color: selectedTheme === t.key ? '#D4AF37' : '#FFF',
                fontSize: theme.typography.size.sm, fontWeight: selectedTheme === t.key ? 700 : 500,
                cursor: 'pointer', textAlign: 'center',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {selectedTheme === 'custom' && (
            <input data-testid="custom-theme-input" value={customTheme} onChange={(e) => setCustomTheme(e.target.value)}
              placeholder="Describe your vibe..." style={{
                width: '100%', padding: theme.spacing[3], marginBottom: theme.spacing[4],
                borderRadius: theme.radius.none, border: '1px solid #1F1F1F',
                background: 'rgba(255,255,255,0.03)', color: '#FFF',
                fontSize: theme.typography.size.sm, outline: 'none', boxSizing: 'border-box',
              }}
            />
          )}

          <p style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.15em', color: '#9D4EDD', marginBottom: theme.spacing[3], textTransform: 'uppercase' }}>
            Style
          </p>
          <div style={{ display: 'flex', gap: theme.spacing[2], marginBottom: theme.spacing[5], flexWrap: 'wrap' }}>
            {STYLES.map((s) => (
              <button key={s.key} data-testid={`style-${s.key}`} onClick={() => setSelectedStyle(s.key)} style={{
                padding: `${theme.spacing[2]} ${theme.spacing[4]}`, borderRadius: theme.radius.none,
                border: selectedStyle === s.key ? '2px solid #9D4EDD' : '1px solid #1F1F1F',
                background: selectedStyle === s.key ? 'rgba(157,78,221,0.1)' : 'transparent',
                color: selectedStyle === s.key ? '#9D4EDD' : '#9CA3AF',
                fontSize: theme.typography.size.sm, fontWeight: 600, cursor: 'pointer',
              }}>
                {s.label}
              </button>
            ))}
          </div>

          <button data-testid="generate-mood-board-btn" onClick={handleGenerate} disabled={!canGenerate || generating} style={{
            width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.none,
            border: 'none',
            background: canGenerate && !generating ? 'linear-gradient(135deg, #D4AF37, #9D4EDD)' : '#1F1F1F',
            color: canGenerate && !generating ? '#FFF' : '#555',
            fontSize: theme.typography.size.md, fontWeight: 700,
            fontFamily: theme.typography.fontFamily.heading,
            cursor: canGenerate && !generating ? 'pointer' : 'not-allowed',
          }}>
            {generating ? (
              <span><SpinnerGap size={16} className="animate-glow" style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Generating...</span>
            ) : 'GENERATE MOOD BOARD'}
          </button>
        </motion.div>
      )}

      {loading && <p style={{ color: '#555', textAlign: 'center' }}>Loading...</p>}

      <div style={{ display: 'grid', gap: theme.spacing[4] }}>
        {boards.map((board, i) => (
          <motion.div key={board.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            data-testid={`mood-board-${board.id}`}
            style={{
              borderRadius: theme.radius.none, overflow: 'hidden',
              border: '1px solid #1F1F1F', background: 'rgba(255,255,255,0.02)',
            }}
          >
            {board.image_data && (
              <img src={`data:image/png;base64,${board.image_data}`} alt={board.theme}
                style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover' }}
              />
            )}
            <div style={{ padding: theme.spacing[4] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: theme.typography.size.xs, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {board.theme}
                  </span>
                  <span style={{ fontSize: theme.typography.size.xs, color: '#555', marginLeft: theme.spacing[2] }}>
                    {board.style}
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: '#555' }}>
                  {new Date(board.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && boards.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', marginTop: theme.spacing[10] }}>
          <Palette size={48} color="#1F1F1F" style={{ marginBottom: theme.spacing[3] }} />
          <p style={{ color: '#555', fontSize: theme.typography.size.md }}>No mood boards yet</p>
          <p style={{ color: '#555', fontSize: theme.typography.size.sm }}>Create your first visual vibe together</p>
        </div>
      )}
    </div>
  );
}
