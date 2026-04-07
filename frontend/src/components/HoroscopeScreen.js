import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

const ZODIAC_OPTIONS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

export default function HoroscopeScreen() {
  const { profile, refreshProfile } = useAuth();
  const { mode } = useApp();
  const [horoscope, setHoroscope] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [userSign, setUserSign] = useState('');
  const [partnerSign, setPartnerSign] = useState('');
  const [saving, setSaving] = useState(false);
  const t = getThemeColors(mode);

  useEffect(() => {
    if (profile?.zodiac_sign && profile?.partner_zodiac) {
      loadHoroscope();
    } else {
      setShowSetup(true);
      setLoading(false);
    }
  }, [profile]);

  const loadHoroscope = async () => {
    try {
      const { data } = await api.getHoroscope();
      setHoroscope(data);
    } catch (err) {
      console.error('Failed to load horoscope:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveZodiac = async () => {
    if (!userSign || !partnerSign) return;
    
    setSaving(true);
    try {
      await api.updateProfile({ zodiac_sign: userSign, partner_zodiac: partnerSign });
      await refreshProfile();
      setShowSetup(false);
      loadHoroscope();
    } catch (err) {
      console.error('Failed to save zodiac:', err);
    } finally {
      setSaving(false);
    }
  };

  const getZodiacEmoji = (sign) => {
    const emojis = {
      aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
      leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
      sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓'
    };
    return emojis[sign] || '⭐';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: t.text.muted }}>Loading your stars...</p>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div style={{
        minHeight: '100vh',
        background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
        padding: theme.spacing[4],
        paddingBottom: '100px',
        fontFamily: theme.typography.fontFamily.primary,
      }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: theme.spacing[10] }}>
          <h1 style={{
            fontSize: theme.typography.size.display,
            fontWeight: theme.typography.weight.bold,
            color: t.text.primary,
            textAlign: 'center',
            marginBottom: theme.spacing[2],
          }}>
            Set Your Stars
          </h1>
          <p style={{
            fontSize: theme.typography.size.md,
            color: t.text.secondary,
            textAlign: 'center',
            marginBottom: theme.spacing[8],
          }}>
            BentlyAI needs your zodiac signs to generate personalized relationship horoscopes
          </p>

          <div style={{ marginBottom: theme.spacing[5] }}>
            <label style={{
              fontSize: theme.typography.size.sm,
              color: t.text.muted,
              display: 'block',
              marginBottom: theme.spacing[2],
            }}>
              Your Sign
            </label>
            <select
              data-testid="user-zodiac-select"
              value={userSign}
              onChange={(e) => setUserSign(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing[4],
                borderRadius: theme.radius.lg,
                border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
                color: t.text.primary,
                fontSize: theme.typography.size.md,
                outline: 'none',
              }}
            >
              <option value="">Select your sign</option>
              {ZODIAC_OPTIONS.map(sign => (
                <option key={sign} value={sign}>
                  {getZodiacEmoji(sign)} {sign.charAt(0).toUpperCase() + sign.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: theme.spacing[6] }}>
            <label style={{
              fontSize: theme.typography.size.sm,
              color: t.text.muted,
              display: 'block',
              marginBottom: theme.spacing[2],
            }}>
              Partner's Sign
            </label>
            <select
              data-testid="partner-zodiac-select"
              value={partnerSign}
              onChange={(e) => setPartnerSign(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing[4],
                borderRadius: theme.radius.lg,
                border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
                color: t.text.primary,
                fontSize: theme.typography.size.md,
                outline: 'none',
              }}
            >
              <option value="">Select partner's sign</option>
              {ZODIAC_OPTIONS.map(sign => (
                <option key={sign} value={sign}>
                  {getZodiacEmoji(sign)} {sign.charAt(0).toUpperCase() + sign.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            data-testid="save-zodiac-btn"
            onClick={handleSaveZodiac}
            disabled={!userSign || !partnerSign || saving}
            style={{
              width: '100%',
              padding: theme.spacing[4],
              borderRadius: theme.radius.lg,
              border: 'none',
              background: !userSign || !partnerSign ? 'rgba(0,0,0,0.1)' : t.accent.primary,
              color: !userSign || !partnerSign ? t.text.muted : '#FFFFFF',
              fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold,
              cursor: !userSign || !partnerSign ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save & Get Horoscope'}
          </button>
        </div>
      </div>
    );
  }

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
        <div style={{ textAlign: 'center', marginBottom: theme.spacing[6] }}>
          <h1 style={{
            fontSize: theme.typography.size.display,
            fontWeight: theme.typography.weight.bold,
            color: t.text.primary,
            marginBottom: theme.spacing[2],
          }}>
            Daily Horoscope
          </h1>
          <p style={{
            fontSize: theme.typography.size.sm,
            color: t.text.muted,
          }}>
            Relationship insights from the stars
          </p>
        </div>

        {/* Signs Display */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: theme.spacing[4],
          marginBottom: theme.spacing[6],
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: mode === 'deeplyus' 
                ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})`
                : `linear-gradient(135deg, ${theme.colors.gradient.emotional.start}, ${theme.colors.gradient.emotional.end})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: theme.spacing[2],
            }}>
              {getZodiacEmoji(horoscope?.sign)}
            </div>
            <p style={{
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
              color: t.text.primary,
              textTransform: 'capitalize',
            }}>
              {horoscope?.sign}
            </p>
            <p style={{ fontSize: theme.typography.size.xs, color: t.text.muted }}>You</p>
          </div>

          <div style={{
            fontSize: '24px',
            color: t.accent.primary,
          }}>
            +
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: mode === 'deeplyus' 
                ? `linear-gradient(135deg, ${theme.colors.deep.accent.secondary}, ${theme.colors.deep.accent.primary})`
                : `linear-gradient(135deg, ${theme.colors.accent.secondary}, ${theme.colors.accent.primary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: theme.spacing[2],
            }}>
              {getZodiacEmoji(horoscope?.partner_sign)}
            </div>
            <p style={{
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
              color: t.text.primary,
              textTransform: 'capitalize',
            }}>
              {horoscope?.partner_sign}
            </p>
            <p style={{ fontSize: theme.typography.size.xs, color: t.text.muted }}>Partner</p>
          </div>
        </div>

        {/* Horoscope Content */}
        <div data-testid="horoscope-content" style={{
          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
          borderRadius: theme.radius.xl,
          padding: theme.spacing[6],
          boxShadow: theme.shadow.card,
        }}>
          <p style={{
            fontSize: theme.typography.size.md,
            lineHeight: theme.typography.lineHeight.relaxed,
            color: t.text.primary,
            whiteSpace: 'pre-wrap',
          }}>
            {horoscope?.content || 'Loading your personalized horoscope...'}
          </p>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => setShowSetup(true)}
          style={{
            marginTop: theme.spacing[4],
            padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
            borderRadius: theme.radius.round,
            border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            background: 'transparent',
            color: t.text.muted,
            fontSize: theme.typography.size.sm,
            cursor: 'pointer',
            display: 'block',
            margin: `${theme.spacing[4]} auto 0`,
          }}
        >
          Change zodiac signs
        </button>
      </div>
    </div>
  );
}
