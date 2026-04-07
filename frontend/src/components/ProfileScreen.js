import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import NotificationSettings from './NotificationSettings';
import theme, { getThemeColors } from '../lib/theme';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { mode, setView } = useApp();
  const t = getThemeColors(mode);

  const zodiacLabels = {
    aries: '♈ Aries', taurus: '♉ Taurus', gemini: '♊ Gemini', cancer: '♋ Cancer',
    leo: '♌ Leo', virgo: '♍ Virgo', libra: '♎ Libra', scorpio: '♏ Scorpio',
    sagittarius: '♐ Sagittarius', capricorn: '♑ Capricorn', aquarius: '♒ Aquarius', pisces: '♓ Pisces',
  };

  const loveLangLabels = {
    words_of_affirmation: 'Words of Affirmation',
    acts_of_service: 'Acts of Service',
    receiving_gifts: 'Receiving Gifts',
    quality_time: 'Quality Time',
    physical_touch: 'Physical Touch',
  };

  const primaryLoveLang = profile?.love_languages
    ? Object.entries(profile.love_languages).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  return (
    <div data-testid="profile-screen" style={{
      minHeight: '100vh',
      background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
      padding: theme.spacing[4], paddingBottom: '100px',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, marginBottom: theme.spacing[5] }}>
          Profile
        </h2>

        {/* Profile info */}
        <div style={{
          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
          borderRadius: theme.radius.xl, padding: theme.spacing[5], marginBottom: theme.spacing[4],
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4], marginBottom: theme.spacing[4] }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: theme.radius.round,
              background: `linear-gradient(135deg, ${t.accent.primary}, ${t.accent.secondary || t.accent.primary})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', color: '#FFFFFF', fontWeight: theme.typography.weight.bold,
            }}>
              {(profile?.display_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.bold, color: t.text.primary, margin: 0 }}>
                {profile?.display_name || 'User'}
              </h3>
              <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted, margin: 0 }}>
                {profile?.email}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing[3] }}>
            <div style={{ padding: theme.spacing[3], borderRadius: theme.radius.md, background: mode === 'deeplyus' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: theme.typography.size.xs, color: t.text.muted, display: 'block' }}>Your Sign</span>
              <span style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold, color: t.text.primary }}>
                {zodiacLabels[profile?.zodiac_sign] || 'Not set'}
              </span>
            </div>
            <div style={{ padding: theme.spacing[3], borderRadius: theme.radius.md, background: mode === 'deeplyus' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: theme.typography.size.xs, color: t.text.muted, display: 'block' }}>Partner's Sign</span>
              <span style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold, color: t.text.primary }}>
                {zodiacLabels[profile?.partner_zodiac] || 'Not set'}
              </span>
            </div>
          </div>

          {primaryLoveLang && (
            <div style={{ marginTop: theme.spacing[3], padding: theme.spacing[3], borderRadius: theme.radius.md, background: mode === 'deeplyus' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: theme.typography.size.xs, color: t.text.muted, display: 'block' }}>Love Language</span>
              <span style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold, color: t.accent.primary }}>
                {loveLangLabels[primaryLoveLang] || primaryLoveLang}
              </span>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
          <button
            data-testid="profile-love-language-btn"
            onClick={() => setView('love-language')}
            style={{
              width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.lg, textAlign: 'left',
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
              border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span style={{ fontSize: theme.typography.size.sm, color: t.text.primary }}>
              {primaryLoveLang ? 'View Love Language Results' : 'Take Love Language Quiz'}
            </span>
            <span style={{ color: t.text.muted }}>&#8250;</span>
          </button>
          <button
            data-testid="profile-astrology-btn"
            onClick={() => setView('astrology')}
            style={{
              width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.lg, textAlign: 'left',
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
              border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span style={{ fontSize: theme.typography.size.sm, color: t.text.primary }}>Astrology & Compatibility</span>
            <span style={{ color: t.text.muted }}>&#8250;</span>
          </button>
        </div>

        {/* Notifications */}
        <div style={{ marginBottom: theme.spacing[4] }}>
          <NotificationSettings />
        </div>

        {/* Sign Out */}
        <button
          data-testid="profile-signout-btn"
          onClick={signOut}
          style={{
            width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md,
            border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
            background: 'transparent', color: '#EF4444', fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold, cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
