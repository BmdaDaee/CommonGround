import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme from '../lib/theme';
import { motion } from 'framer-motion';
import { LinkBreak, Copy, UserCircle, ArrowLeft, Check, WarningCircle } from '@phosphor-icons/react';

export default function PartnerSettingsScreen() {
  const { profile, pair, refreshProfile, signOut } = useAuth();
  const { setView } = useApp();
  const [pairData, setPairData] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showUnlink, setShowUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => { loadPairData(); }, []);

  const loadPairData = async () => {
    try {
      const { data } = await api.getMyPair();
      setPairData(data.pair || null);
      setPartner(data.partner || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCopyCode = () => {
    if (pairData?.code) {
      navigator.clipboard.writeText(pairData.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await api.leavePair();
      await refreshProfile();
      setView('home');
    } catch (err) {
      console.error(err);
    } finally {
      setUnlinking(false);
    }
  };

  const zodiacLabels = {
    aries: '\u2648 Aries', taurus: '\u2649 Taurus', gemini: '\u264A Gemini', cancer: '\u264B Cancer',
    leo: '\u264C Leo', virgo: '\u264D Virgo', libra: '\u264E Libra', scorpio: '\u264F Scorpio',
    sagittarius: '\u2650 Sagittarius', capricorn: '\u2651 Capricorn', aquarius: '\u2652 Aquarius', pisces: '\u2653 Pisces',
  };

  const genderLabels = { man: 'Man', woman: 'Woman', 'non-binary': 'Non-Binary', other: 'Other' };

  return (
    <div data-testid="partner-settings-screen" style={{
      padding: theme.spacing[4], paddingBottom: '100px', maxWidth: '500px', margin: '0 auto',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[6] }}>
        <button data-testid="back-to-profile" onClick={() => setView('profile')} style={{
          padding: theme.spacing[2], background: 'transparent', border: '1px solid #1F1F1F',
          borderRadius: theme.radius.none, cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}>
          <ArrowLeft size={18} color="#9CA3AF" />
        </button>
        <div>
          <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: 900, color: '#FFF', margin: 0, fontFamily: theme.typography.fontFamily.heading }}>
            Partner & Pairing
          </h2>
          <p style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF', margin: 0 }}>Manage your connection</p>
        </div>
      </div>

      {loading && <p style={{ color: '#555', textAlign: 'center' }}>Loading...</p>}

      {!loading && pairData && (
        <>
          {/* Pair Code Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              padding: theme.spacing[5], marginBottom: theme.spacing[4],
              background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(157,78,221,0.05))',
              border: '1px solid rgba(212,175,55,0.2)', borderRadius: theme.radius.none,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[3] }}>
              <span style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', fontFamily: theme.typography.fontFamily.heading }}>
                PAIR CODE
              </span>
              <span style={{
                fontSize: theme.typography.size.xs, padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                background: pairData.status === 'ACTIVE' ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)',
                color: pairData.status === 'ACTIVE' ? '#4CAF50' : '#FF9800',
                borderRadius: theme.radius.none, fontWeight: 700,
              }}>
                {pairData.status}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
              <span data-testid="pair-code-value" style={{
                fontSize: theme.typography.size.hero, fontWeight: 900,
                color: '#D4AF37', letterSpacing: '6px',
                fontFamily: theme.typography.fontFamily.heading,
              }}>
                {pairData.code}
              </span>
              <button data-testid="copy-pair-code-btn" onClick={handleCopyCode} style={{
                padding: theme.spacing[2], background: copied ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.05)',
                border: '1px solid #1F1F1F', borderRadius: theme.radius.none, cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}>
                {copied ? <Check size={18} color="#4CAF50" /> : <Copy size={18} color="#9CA3AF" />}
              </button>
            </div>
            <p style={{ fontSize: theme.typography.size.xs, color: '#555', marginTop: theme.spacing[2] }}>
              Share this code with your partner to link accounts
            </p>
          </motion.div>

          {/* Partner Info Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{
              padding: theme.spacing[5], marginBottom: theme.spacing[4],
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1F1F1F',
              borderRadius: theme.radius.none,
            }}
          >
            <span style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.2em', color: '#9D4EDD', textTransform: 'uppercase', fontFamily: theme.typography.fontFamily.heading, display: 'block', marginBottom: theme.spacing[3] }}>
              PARTNER
            </span>
            {partner ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4] }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9D4EDD, #E63946)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', color: '#FFF', fontWeight: 700, flexShrink: 0,
                }}>
                  {(partner.display_name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 data-testid="partner-name" style={{ fontSize: theme.typography.size.lg, fontWeight: 700, color: '#FFF', margin: 0 }}>
                    {partner.display_name || 'Partner'}
                  </h3>
                  <div style={{ display: 'flex', gap: theme.spacing[3], marginTop: theme.spacing[1], flexWrap: 'wrap' }}>
                    {partner.gender && (
                      <span style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF' }}>
                        {genderLabels[partner.gender] || partner.gender}
                      </span>
                    )}
                    {partner.zodiac_sign && (
                      <span style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF' }}>
                        {zodiacLabels[partner.zodiac_sign] || partner.zodiac_sign}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
                <UserCircle size={48} color="#1F1F1F" />
                <div>
                  <p style={{ fontSize: theme.typography.size.md, color: '#555', margin: 0 }}>Waiting for partner</p>
                  <p style={{ fontSize: theme.typography.size.xs, color: '#555', margin: 0 }}>Share your pair code to connect</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Your Info Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{
              padding: theme.spacing[5], marginBottom: theme.spacing[4],
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1F1F1F',
              borderRadius: theme.radius.none,
            }}
          >
            <span style={{ fontSize: theme.typography.size.xs, fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', fontFamily: theme.typography.fontFamily.heading, display: 'block', marginBottom: theme.spacing[3] }}>
              YOU
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing[3] }}>
              <InfoTile label="Name" value={profile?.display_name || 'Not set'} />
              <InfoTile label="Gender" value={genderLabels[profile?.gender] || profile?.gender || 'Not set'} />
              <InfoTile label="Ethnicity" value={profile?.ethnicity ? profile.ethnicity.charAt(0).toUpperCase() + profile.ethnicity.slice(1) : 'Not set'} />
              <InfoTile label="Zodiac" value={zodiacLabels[profile?.zodiac_sign] || 'Not set'} />
              <InfoTile label="Partner's Zodiac" value={zodiacLabels[profile?.partner_zodiac] || 'Not set'} />
              <InfoTile label="Birthday" value={profile?.birth_date || 'Not set'} />
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}
          >
            <button data-testid="edit-profile-btn" onClick={() => setView('profile')} style={{
              width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.none,
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1F1F1F',
              color: '#FFF', fontSize: theme.typography.size.sm, fontWeight: 600,
              cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>Profile & Notifications</span>
              <span style={{ color: '#555' }}>&rsaquo;</span>
            </button>

            {/* Unlink */}
            {!showUnlink ? (
              <button data-testid="show-unlink-btn" onClick={() => setShowUnlink(true)} style={{
                width: '100%', padding: theme.spacing[4], borderRadius: theme.radius.none,
                background: 'transparent', border: '1px solid rgba(230,57,70,0.3)',
                color: '#E63946', fontSize: theme.typography.size.sm, fontWeight: 600,
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: theme.spacing[2],
              }}>
                <LinkBreak size={18} /> Unlink Partner
              </button>
            ) : (
              <div style={{
                padding: theme.spacing[5], borderRadius: theme.radius.none,
                background: 'rgba(230,57,70,0.05)', border: '1px solid rgba(230,57,70,0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[3] }}>
                  <WarningCircle size={20} color="#E63946" />
                  <span style={{ fontSize: theme.typography.size.sm, color: '#E63946', fontWeight: 700 }}>
                    Are you sure?
                  </span>
                </div>
                <p style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF', marginBottom: theme.spacing[4] }}>
                  This will unlink you from your partner. You'll need to re-pair using a new code. Your data will be preserved.
                </p>
                <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                  <button data-testid="cancel-unlink-btn" onClick={() => setShowUnlink(false)} style={{
                    flex: 1, padding: theme.spacing[3], borderRadius: theme.radius.none,
                    border: '1px solid #1F1F1F', background: 'transparent',
                    color: '#9CA3AF', fontSize: theme.typography.size.sm, cursor: 'pointer',
                  }}>
                    Cancel
                  </button>
                  <button data-testid="confirm-unlink-btn" onClick={handleUnlink} disabled={unlinking} style={{
                    flex: 1, padding: theme.spacing[3], borderRadius: theme.radius.none,
                    border: 'none', background: '#E63946',
                    color: '#FFF', fontSize: theme.typography.size.sm, fontWeight: 700, cursor: 'pointer',
                    opacity: unlinking ? 0.7 : 1,
                  }}>
                    {unlinking ? 'Unlinking...' : 'Unlink'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {!loading && !pairData && (
        <div style={{ textAlign: 'center', marginTop: theme.spacing[10] }}>
          <UserCircle size={64} color="#1F1F1F" style={{ marginBottom: theme.spacing[3] }} />
          <p style={{ color: '#555', fontSize: theme.typography.size.md, marginBottom: theme.spacing[4] }}>Not currently paired</p>
          <p style={{ color: '#555', fontSize: theme.typography.size.sm }}>You'll be redirected to the pairing screen</p>
        </div>
      )}
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div style={{
      padding: theme.spacing[3], background: 'rgba(255,255,255,0.03)',
      borderRadius: theme.radius.none,
    }}>
      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
        {label}
      </span>
      <span style={{ fontSize: theme.typography.size.sm, fontWeight: 600, color: '#FFF' }}>
        {value}
      </span>
    </div>
  );
}
