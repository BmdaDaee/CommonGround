import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function WeeklyReportScreen() {
  const { mode } = useApp();
  const [report, setReport] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const t = getThemeColors(mode);

  useEffect(() => { loadReport(); }, []);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.getWeeklyReport();
      setReport(data.report);
      setStats(data.stats);
    } catch (err) {
      setError('Could not generate report right now.');
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="weekly-report-screen" style={{
      padding: theme.spacing[4], paddingBottom: '100px', maxWidth: '600px', margin: '0 auto',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, marginBottom: theme.spacing[1] }}>
        Weekly Check-In
      </h2>
      <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted, marginBottom: theme.spacing[5] }}>
        Your relationship pulse, powered by BentlyAI
      </p>

      {loading && (
        <div style={{
          padding: theme.spacing[8], textAlign: 'center',
          borderRadius: theme.radius.xl,
          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
        }}>
          <p style={{ color: t.text.muted, fontSize: theme.typography.size.sm }}>Generating your weekly report...</p>
        </div>
      )}

      {error && (
        <div style={{
          padding: theme.spacing[4], borderRadius: theme.radius.lg,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <p style={{ color: '#EF4444', fontSize: theme.typography.size.sm, margin: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && stats && (
        <>
          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing[3], marginBottom: theme.spacing[5] }}>
            <div style={{
              padding: theme.spacing[4], borderRadius: theme.radius.lg, textAlign: 'center',
              background: `linear-gradient(135deg, ${mode === 'deeplyus' ? theme.colors.deep.gradient.start : theme.colors.gradient.emotional.start}, ${mode === 'deeplyus' ? theme.colors.deep.gradient.end : theme.colors.gradient.emotional.end})`,
            }}>
              <span style={{ fontSize: theme.typography.size.hero, fontWeight: theme.typography.weight.bold, color: '#FFFFFF', display: 'block' }}>
                {stats.questions_answered}
              </span>
              <span style={{ fontSize: theme.typography.size.xs, color: 'rgba(255,255,255,0.7)' }}>
                Questions answered together
              </span>
            </div>
            <div style={{
              padding: theme.spacing[4], borderRadius: theme.radius.lg, textAlign: 'center',
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.06)' : theme.colors.bg.surface,
              boxShadow: mode === 'deeplyus' ? theme.shadow.deep.soft : theme.shadow.card,
            }}>
              <span style={{ fontSize: theme.typography.size.hero, fontWeight: theme.typography.weight.bold, color: t.accent.primary, display: 'block' }}>
                {stats.messages_sent}
              </span>
              <span style={{ fontSize: theme.typography.size.xs, color: t.text.muted }}>
                Messages exchanged
              </span>
            </div>
          </div>

          {/* AI Report */}
          <div style={{
            padding: theme.spacing[5], borderRadius: theme.radius.xl,
            background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
            boxShadow: mode === 'deeplyus' ? theme.shadow.deep.soft : theme.shadow.card,
            marginBottom: theme.spacing[4],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[3] }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: theme.radius.round,
                background: `linear-gradient(135deg, ${t.accent.primary}, ${t.accent.secondary || t.accent.primary})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#FFF',
              }}>
                B
              </div>
              <span style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold, color: t.text.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>
                BentlyAI Weekly Report
              </span>
            </div>
            <p data-testid="report-text" style={{
              fontSize: theme.typography.size.sm, color: t.text.primary,
              lineHeight: theme.typography.lineHeight.relaxed, whiteSpace: 'pre-wrap', margin: 0,
            }}>
              {report}
            </p>
          </div>

          <p style={{ fontSize: theme.typography.size.xs, color: t.text.muted, textAlign: 'center' }}>
            {stats.week_start} — {stats.week_end}
          </p>

          <button data-testid="refresh-report-btn" onClick={loadReport} style={{
            width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md, marginTop: theme.spacing[3],
            border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
            background: 'transparent', color: t.text.secondary, fontSize: theme.typography.size.sm, cursor: 'pointer',
          }}>
            Refresh Report
          </button>
        </>
      )}
    </div>
  );
}
