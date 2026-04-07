import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

const STYLES = [
  { key: 'anime', label: 'Anime', desc: 'Japanese animation style' },
  { key: 'watercolor', label: 'Watercolor', desc: 'Soft and dreamy' },
  { key: 'oil-painting', label: 'Oil Painting', desc: 'Classic and rich' },
  { key: 'digital-art', label: 'Digital Art', desc: 'Modern illustration' },
  { key: 'sketch', label: 'Pencil Sketch', desc: 'Intimate hand-drawn' },
  { key: 'pop-art', label: 'Pop Art', desc: 'Bold and colorful' },
];

export default function PortraitsScreen() {
  const { profile } = useAuth();
  const { mode } = useApp();
  const [portraits, setPortraits] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('anime');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPortrait, setSelectedPortrait] = useState(null);
  const t = getThemeColors(mode);

  useEffect(() => {
    loadPortraits();
  }, []);

  const loadPortraits = async () => {
    try {
      const { data } = await api.getPortraits();
      setPortraits(data.portraits || []);
    } catch (err) {
      console.error('Failed to load portraits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const { data } = await api.generatePortrait(prompt.trim(), style);
      if (data.portrait) {
        setPortraits(prev => [data.portrait, ...prev]);
        setSelectedPortrait(data.portrait);
        setPrompt('');
      }
    } catch (err) {
      console.error('Failed to generate portrait:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div data-testid="portraits-screen" style={{
      minHeight: '100vh',
      background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
      padding: theme.spacing[4],
      paddingBottom: '100px',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, marginBottom: theme.spacing[1] }}>
          Couple Portraits
        </h2>
        <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted, marginBottom: theme.spacing[5] }}>
          AI-generated art of you and your partner
        </p>

        {/* Generator */}
        <div style={{
          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
          borderRadius: theme.radius.xl, padding: theme.spacing[5], marginBottom: theme.spacing[5],
          boxShadow: mode === 'deeplyus' ? theme.shadow.deep.soft : theme.shadow.card,
        }}>
          <label style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold, color: t.text.primary, display: 'block', marginBottom: theme.spacing[2] }}>
            Describe yourselves
          </label>
          <textarea
            data-testid="portrait-prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A tall guy with curly hair and a girl with freckles, walking on the beach at sunset..."
            rows={3}
            style={{
              width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
              color: t.text.primary, fontSize: theme.typography.size.sm, resize: 'none', outline: 'none',
              fontFamily: theme.typography.fontFamily.primary, boxSizing: 'border-box',
            }}
          />

          {/* Style picker */}
          <label style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold, color: t.text.primary, display: 'block', marginTop: theme.spacing[4], marginBottom: theme.spacing[2] }}>
            Art Style
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
            {STYLES.map((s) => (
              <button
                key={s.key}
                data-testid={`portrait-style-${s.key}`}
                onClick={() => setStyle(s.key)}
                style={{
                  padding: theme.spacing[2], borderRadius: theme.radius.md, textAlign: 'center',
                  border: style === s.key ? `2px solid ${t.accent.primary}` : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  background: style === s.key ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.15)' : 'rgba(255,111,174,0.08)') : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.semibold, color: style === s.key ? t.accent.primary : t.text.primary, display: 'block' }}>
                  {s.label}
                </span>
                <span style={{ fontSize: '10px', color: t.text.muted }}>{s.desc}</span>
              </button>
            ))}
          </div>

          <button
            data-testid="generate-portrait-btn"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            style={{
              width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md, border: 'none',
              background: generating || !prompt.trim() ? (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : t.accent.primary,
              color: generating || !prompt.trim() ? t.text.muted : '#FFFFFF',
              fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold,
              cursor: generating || !prompt.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {generating ? 'Generating portrait (this may take a minute)...' : 'Generate Portrait'}
          </button>
        </div>

        {/* Selected portrait viewer */}
        {selectedPortrait && selectedPortrait.image_data && (
          <div data-testid="portrait-viewer" style={{
            borderRadius: theme.radius.xl, overflow: 'hidden', marginBottom: theme.spacing[5],
            boxShadow: mode === 'deeplyus' ? theme.shadow.deep.glow : theme.shadow.card,
          }}>
            <img
              src={`data:image/png;base64,${selectedPortrait.image_data}`}
              alt="Couple portrait"
              style={{ width: '100%', display: 'block' }}
            />
            <div style={{
              padding: theme.spacing[3],
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ fontSize: theme.typography.size.xs, color: t.text.muted, margin: 0 }}>
                "{selectedPortrait.prompt}" — {selectedPortrait.style}
              </p>
              <button
                data-testid="share-portrait-btn"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `data:image/png;base64,${selectedPortrait.image_data}`;
                  link.download = `commonground-portrait-${selectedPortrait.id || 'art'}.png`;
                  link.click();
                }}
                style={{
                  padding: `${theme.spacing[1]} ${theme.spacing[3]}`, borderRadius: theme.radius.round,
                  border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                  background: 'transparent', color: t.accent.primary,
                  fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.semibold,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                Download
              </button>
            </div>
          </div>
        )}

        {/* Gallery */}
        {portraits.length > 0 && (
          <>
            <h3 style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: theme.spacing[3] }}>
              Gallery
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing[3] }}>
              {portraits.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPortrait(p)}
                  style={{
                    padding: 0, border: selectedPortrait?.id === p.id ? `2px solid ${t.accent.primary}` : '1px solid transparent',
                    borderRadius: theme.radius.lg, overflow: 'hidden', cursor: 'pointer', background: 'transparent',
                  }}
                >
                  {p.image_data ? (
                    <img src={`data:image/png;base64,${p.image_data}`} alt={p.prompt} style={{ width: '100%', display: 'block', borderRadius: theme.radius.md }} />
                  ) : (
                    <div style={{
                      height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderRadius: theme.radius.md,
                    }}>
                      <span style={{ color: t.text.muted, fontSize: theme.typography.size.xs }}>Generating...</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {portraits.length === 0 && !loading && (
          <p style={{ textAlign: 'center', color: t.text.muted, fontSize: theme.typography.size.sm }}>
            No portraits yet. Describe yourselves and generate your first!
          </p>
        )}
      </div>
    </div>
  );
}
