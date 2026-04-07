import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

const AVATAR_STYLES = [
  { key: 'anime', label: 'Anime' },
  { key: 'watercolor', label: 'Watercolor' },
  { key: 'pixel-art', label: 'Pixel Art' },
  { key: 'cartoon', label: 'Cartoon' },
  { key: 'realistic', label: 'Realistic' },
  { key: 'chibi', label: 'Chibi' },
];

export default function AvatarScreen() {
  const { profile, refreshProfile } = useAuth();
  const { mode } = useApp();
  const [avatar, setAvatar] = useState(null);
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('anime');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const t = getThemeColors(mode);

  useEffect(() => { loadAvatar(); }, []);

  const loadAvatar = async () => {
    try {
      const { data } = await api.getAvatar();
      if (data.avatar) {
        setAvatar(data.avatar);
        setDescription(data.description || '');
        setStyle(data.style || 'anime');
      }
    } catch (err) {
      console.error('Failed to load avatar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setGenerating(true);
    try {
      const { data } = await api.generateAvatar(description.trim(), style);
      setAvatar(data.avatar);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to generate avatar:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div data-testid="avatar-screen" style={{
      padding: theme.spacing[4], paddingBottom: '100px', maxWidth: '500px', margin: '0 auto',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, marginBottom: theme.spacing[1] }}>
        My Avatar
      </h2>
      <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted, marginBottom: theme.spacing[5] }}>
        AI-generated avatar that represents you
      </p>

      {/* Current avatar display */}
      {avatar && (
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: theme.spacing[5],
        }}>
          <div style={{
            width: '200px', height: '200px', borderRadius: theme.radius.round, overflow: 'hidden',
            boxShadow: mode === 'deeplyus' ? theme.shadow.deep.glow : theme.shadow.card,
            border: `3px solid ${t.accent.primary}`,
          }}>
            <img
              src={`data:image/png;base64,${avatar}`}
              alt="Your avatar"
              data-testid="avatar-image"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      )}

      {!avatar && !loading && (
        <div style={{
          width: '200px', height: '200px', borderRadius: theme.radius.round, margin: `0 auto ${theme.spacing[5]}`,
          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px dashed ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
        }}>
          <span style={{ fontSize: theme.typography.size.sm, color: t.text.muted }}>No avatar yet</span>
        </div>
      )}

      {/* Generator form */}
      <div style={{
        padding: theme.spacing[5], borderRadius: theme.radius.xl,
        background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
        boxShadow: mode === 'deeplyus' ? theme.shadow.deep.soft : theme.shadow.card,
      }}>
        <label style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold, color: t.text.primary, display: 'block', marginBottom: theme.spacing[2] }}>
          Describe yourself
        </label>
        <textarea
          data-testid="avatar-description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Tall with brown curly hair, brown eyes, light skin, wearing a hoodie..."
          rows={3}
          style={{
            width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md,
            border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
            background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
            color: t.text.primary, fontSize: theme.typography.size.sm, resize: 'none', outline: 'none',
            fontFamily: theme.typography.fontFamily.primary, boxSizing: 'border-box',
          }}
        />

        <label style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold, color: t.text.primary, display: 'block', marginTop: theme.spacing[4], marginBottom: theme.spacing[2] }}>
          Style
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
          {AVATAR_STYLES.map((s) => (
            <button
              key={s.key}
              data-testid={`avatar-style-${s.key}`}
              onClick={() => setStyle(s.key)}
              style={{
                padding: theme.spacing[2], borderRadius: theme.radius.md, textAlign: 'center',
                border: style === s.key ? `2px solid ${t.accent.primary}` : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                background: style === s.key ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.15)' : 'rgba(255,111,174,0.08)') : 'transparent',
                color: style === s.key ? t.accent.primary : t.text.primary,
                fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.semibold, cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          data-testid="generate-avatar-btn"
          onClick={handleGenerate}
          disabled={generating || !description.trim()}
          style={{
            width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md, border: 'none',
            background: generating || !description.trim() ? (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : t.accent.primary,
            color: generating || !description.trim() ? t.text.muted : '#FFFFFF',
            fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold,
            cursor: generating || !description.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? 'Generating (this may take a minute)...' : avatar ? 'Regenerate Avatar' : 'Generate Avatar'}
        </button>
      </div>
    </div>
  );
}
