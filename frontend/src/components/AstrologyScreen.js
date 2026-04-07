import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function AstrologyScreen() {
  const { profile, refreshProfile } = useAuth();
  const { mode } = useApp();
  const [astroData, setAstroData] = useState(null);
  const [birthDate, setBirthDate] = useState(profile?.birth_date || '');
  const [birthTime, setBirthTime] = useState(profile?.birth_time || '');
  const [birthLocation, setBirthLocation] = useState(profile?.birth_location || '');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const t = getThemeColors(mode);

  useEffect(() => {
    if (profile?.astrology_profile) {
      setAstroData(profile.astrology_profile);
    }
  }, [profile]);

  const handleGenerate = async () => {
    if (!birthDate) return;
    setGenerating(true);
    try {
      const { data } = await api.astrologyDeepDive(birthDate, birthTime || null, birthLocation || null, null, null);
      setAstroData(data.astrology);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to generate astrology:', err);
    } finally {
      setGenerating(false);
    }
  };

  const InfoCard = ({ label, value, accent }) => (
    <div style={{
      padding: theme.spacing[3], borderRadius: theme.radius.md,
      background: mode === 'deeplyus' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: theme.typography.size.xs, color: t.text.muted, display: 'block', marginBottom: theme.spacing[1], textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.bold, color: accent ? t.accent.primary : t.text.primary }}>
        {value || '—'}
      </span>
    </div>
  );

  return (
    <div data-testid="astrology-screen" style={{
      minHeight: '100vh',
      background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
      padding: theme.spacing[4], paddingBottom: '100px',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, marginBottom: theme.spacing[1] }}>
          Astrology & Compatibility
        </h2>
        <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted, marginBottom: theme.spacing[5] }}>
          Your cosmic blueprint and relationship alignment
        </p>

        {/* Birth info form */}
        {!astroData && (
          <div style={{
            background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
            borderRadius: theme.radius.xl, padding: theme.spacing[5], marginBottom: theme.spacing[5],
            boxShadow: mode === 'deeplyus' ? theme.shadow.deep.soft : theme.shadow.card,
          }}>
            <h3 style={{ fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold, color: t.text.primary, marginBottom: theme.spacing[4] }}>
              Enter your birth details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <div>
                <label style={{ fontSize: theme.typography.size.xs, color: t.text.muted, display: 'block', marginBottom: theme.spacing[1] }}>Birth Date *</label>
                <input data-testid="astro-birth-date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{
                  width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md,
                  border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : '#1F1F1F'}`,
                  background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  color: t.text.primary, fontSize: theme.typography.size.sm, outline: 'none', boxSizing: 'border-box',
                }} />
              </div>
              <div>
                <label style={{ fontSize: theme.typography.size.xs, color: t.text.muted, display: 'block', marginBottom: theme.spacing[1] }}>Birth Time (optional)</label>
                <input data-testid="astro-birth-time" type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} style={{
                  width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md,
                  border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : '#1F1F1F'}`,
                  background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  color: t.text.primary, fontSize: theme.typography.size.sm, outline: 'none', boxSizing: 'border-box',
                }} />
              </div>
              <div>
                <label style={{ fontSize: theme.typography.size.xs, color: t.text.muted, display: 'block', marginBottom: theme.spacing[1] }}>Birth Location (optional)</label>
                <input data-testid="astro-birth-location" type="text" value={birthLocation} onChange={(e) => setBirthLocation(e.target.value)} placeholder="City, Country" style={{
                  width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md,
                  border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : '#1F1F1F'}`,
                  background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  color: t.text.primary, fontSize: theme.typography.size.sm, outline: 'none', boxSizing: 'border-box',
                  fontFamily: theme.typography.fontFamily.primary,
                }} />
              </div>
              <button data-testid="generate-astrology-btn" onClick={handleGenerate} disabled={!birthDate || generating} style={{
                padding: theme.spacing[3], borderRadius: theme.radius.md, border: 'none',
                background: !birthDate || generating ? (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : '#1F1F1F') : t.accent.primary,
                color: !birthDate || generating ? t.text.muted : '#FFFFFF',
                fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold, cursor: !birthDate || generating ? 'not-allowed' : 'pointer',
              }}>
                {generating ? 'Reading the stars...' : 'Generate Birth Chart'}
              </button>
            </div>
          </div>
        )}

        {/* Astrology results */}
        {astroData && (
          <div>
            {/* Signs grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
              <InfoCard label="Sun" value={astroData.sun_sign} accent />
              <InfoCard label="Moon" value={astroData.moon_sign} />
              <InfoCard label="Rising" value={astroData.rising_sign} />
            </div>

            {astroData.element && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
                <InfoCard label="Element" value={astroData.element} />
                <InfoCard label="Modality" value={astroData.modality} />
              </div>
            )}

            {/* Personality */}
            {astroData.personality_summary && (
              <div style={{
                background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
                borderRadius: theme.radius.lg, padding: theme.spacing[4], marginBottom: theme.spacing[4],
              }}>
                <h3 style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', marginBottom: theme.spacing[2] }}>Personality</h3>
                <p style={{ fontSize: theme.typography.size.sm, color: t.text.primary, lineHeight: theme.typography.lineHeight.relaxed }}>{astroData.personality_summary}</p>
              </div>
            )}

            {/* Love Style */}
            {astroData.love_style && (
              <div style={{
                background: `linear-gradient(135deg, ${mode === 'deeplyus' ? theme.colors.deep.gradient.start : theme.colors.gradient.emotional.start}, ${mode === 'deeplyus' ? theme.colors.deep.gradient.end : theme.colors.gradient.emotional.end})`,
                borderRadius: theme.radius.lg, padding: theme.spacing[4], marginBottom: theme.spacing[4],
              }}>
                <h3 style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.bold, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: theme.spacing[2] }}>How You Love</h3>
                <p style={{ fontSize: theme.typography.size.sm, color: '#FFFFFF', lineHeight: theme.typography.lineHeight.relaxed }}>{astroData.love_style}</p>
              </div>
            )}

            {/* Compatibility */}
            {astroData.compatibility_score && (
              <div style={{
                background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
                borderRadius: theme.radius.lg, padding: theme.spacing[4], marginBottom: theme.spacing[4], textAlign: 'center',
              }}>
                <h3 style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', marginBottom: theme.spacing[3] }}>Compatibility</h3>
                <div style={{ fontSize: theme.typography.size.hero, fontWeight: theme.typography.weight.bold, color: t.accent.primary, marginBottom: theme.spacing[2] }}>
                  {astroData.compatibility_score}%
                </div>
                {astroData.compatibility_summary && (
                  <p style={{ fontSize: theme.typography.size.sm, color: t.text.secondary, lineHeight: theme.typography.lineHeight.relaxed }}>{astroData.compatibility_summary}</p>
                )}
              </div>
            )}

            {/* Strengths & Challenges */}
            {astroData.strengths && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
                <div style={{ background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface, borderRadius: theme.radius.lg, padding: theme.spacing[3] }}>
                  <h4 style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold, color: '#10B981', textTransform: 'uppercase', marginBottom: theme.spacing[2] }}>Strengths</h4>
                  {astroData.strengths.map((s, i) => (
                    <p key={i} style={{ fontSize: theme.typography.size.xs, color: t.text.secondary, marginBottom: theme.spacing[1] }}>+ {s}</p>
                  ))}
                </div>
                <div style={{ background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface, borderRadius: theme.radius.lg, padding: theme.spacing[3] }}>
                  <h4 style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold, color: '#F59E0B', textTransform: 'uppercase', marginBottom: theme.spacing[2] }}>Challenges</h4>
                  {(astroData.challenges || []).map((c, i) => (
                    <p key={i} style={{ fontSize: theme.typography.size.xs, color: t.text.secondary, marginBottom: theme.spacing[1] }}>~ {c}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly forecast */}
            {astroData.weekly_forecast && (
              <div style={{
                background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
                borderRadius: theme.radius.lg, padding: theme.spacing[4], marginBottom: theme.spacing[4],
              }}>
                <h3 style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', marginBottom: theme.spacing[2] }}>This Week</h3>
                <p style={{ fontSize: theme.typography.size.sm, color: t.text.primary, lineHeight: theme.typography.lineHeight.relaxed }}>{astroData.weekly_forecast}</p>
              </div>
            )}

            {/* Advice */}
            {astroData.advice && (
              <div style={{
                padding: theme.spacing[4], borderRadius: theme.radius.lg,
                background: mode === 'deeplyus' ? 'rgba(74,108,255,0.15)' : 'rgba(99,102,241,0.08)',
                border: `1px solid ${mode === 'deeplyus' ? 'rgba(74,108,255,0.3)' : 'rgba(99,102,241,0.15)'}`,
                marginBottom: theme.spacing[4],
              }}>
                <span style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold, color: t.accent.secondary || t.accent.primary, textTransform: 'uppercase' }}>Advice</span>
                <p style={{ fontSize: theme.typography.size.sm, color: t.text.primary, marginTop: theme.spacing[1], lineHeight: theme.typography.lineHeight.relaxed }}>{astroData.advice}</p>
              </div>
            )}

            <button data-testid="regenerate-astrology-btn" onClick={() => { setAstroData(null); }} style={{
              width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : '#1F1F1F'}`,
              background: 'transparent', color: t.text.secondary, fontSize: theme.typography.size.sm, cursor: 'pointer',
            }}>
              Regenerate with different details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
