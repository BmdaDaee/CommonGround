import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function JournalScreen() {
  const { mode } = useApp();
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const t = getThemeColors(mode);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data } = await api.getJournalEntries(20);
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to load entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!newEntry.trim()) return;
    setSaving(true);
    try {
      await api.createJournalEntry(newEntry.trim());
      setNewEntry('');
      loadEntries();
    } catch (err) {
      console.error('Failed to save entry:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async (entryId) => {
    setAnalyzing(entryId);
    try {
      const { data } = await api.analyzeJournalEntry(entryId);
      setEntries(prev => prev.map(e => e.id === entryId ? data.entry : e));
    } catch (err) {
      console.error('Failed to analyze entry:', err);
    } finally {
      setAnalyzing(null);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
        <div style={{ marginBottom: theme.spacing[5] }}>
          <h1 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, marginBottom: theme.spacing[1] }}>
            Confessional
          </h1>
          <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted }}>
            Your private space to process feelings. BentlyAI listens.
          </p>
        </div>

        {/* New Entry */}
        <div style={{
          background: mode === 'deeplyus' 
            ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})`
            : `linear-gradient(135deg, ${theme.colors.gradient.emotional.start}, ${theme.colors.gradient.emotional.end})`,
          borderRadius: theme.radius.xl,
          padding: theme.spacing[5],
          marginBottom: theme.spacing[6],
          boxShadow: mode === 'deeplyus' ? theme.shadow.deep.glow : theme.shadow.card,
        }}>
          <p style={{
            fontSize: theme.typography.size.sm,
            color: mode === 'deeplyus' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            marginBottom: theme.spacing[3],
          }}>
            What's on your mind today?
          </p>
          <textarea
            data-testid="journal-input"
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="Write freely... this stays private."
            rows={6}
            style={{
              width: '100%',
              padding: theme.spacing[4],
              borderRadius: theme.radius.lg,
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
              fontSize: theme.typography.size.md,
              resize: 'none',
              outline: 'none',
              fontFamily: theme.typography.fontFamily.primary,
              lineHeight: theme.typography.lineHeight.relaxed,
              boxSizing: 'border-box',
            }}
          />
          <button
            data-testid="save-journal-btn"
            onClick={handleSaveEntry}
            disabled={!newEntry.trim() || saving}
            style={{
              marginTop: theme.spacing[3],
              padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
              borderRadius: theme.radius.round,
              border: 'none',
              background: !newEntry.trim() ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
              color: !newEntry.trim() ? 'rgba(255,255,255,0.5)' : theme.colors.text.primary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
              cursor: newEntry.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>

        {/* Past Entries */}
        <h2 style={{ fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.semibold, color: t.text.primary, marginBottom: theme.spacing[4] }}>
          Past Entries
        </h2>
        
        {loading ? (
          <p style={{ color: t.text.muted }}>Loading...</p>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: theme.spacing[8], color: t.text.muted }}>
            <p style={{ fontSize: '32px', marginBottom: theme.spacing[2] }}>📝</p>
            <p>Your confessional is empty</p>
            <p style={{ fontSize: theme.typography.size.sm }}>Write your first entry above</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
            {entries.map(entry => (
              <div
                key={entry.id}
                style={{
                  background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing[4],
                  boxShadow: theme.shadow.soft,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[3] }}>
                  <span style={{ fontSize: theme.typography.size.xs, color: t.text.muted }}>
                    {formatDate(entry.created_at)}
                  </span>
                  {!entry.analysis && (
                    <button
                      onClick={() => handleAnalyze(entry.id)}
                      disabled={analyzing === entry.id}
                      style={{
                        padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
                        borderRadius: theme.radius.round,
                        border: 'none',
                        background: t.accent.secondary,
                        color: '#FFFFFF',
                        fontSize: theme.typography.size.xs,
                        fontWeight: theme.typography.weight.semibold,
                        cursor: 'pointer',
                        opacity: analyzing === entry.id ? 0.5 : 1,
                      }}
                    >
                      {analyzing === entry.id ? 'Analyzing...' : '✨ Analyze'}
                    </button>
                  )}
                </div>
                
                <p style={{
                  fontSize: theme.typography.size.sm,
                  color: t.text.primary,
                  lineHeight: theme.typography.lineHeight.relaxed,
                  marginBottom: entry.analysis ? theme.spacing[4] : 0,
                }}>
                  {entry.text}
                </p>
                
                {entry.analysis && (
                  <div style={{
                    marginTop: theme.spacing[3],
                    padding: theme.spacing[4],
                    borderRadius: theme.radius.md,
                    background: mode === 'deeplyus' ? 'rgba(255,143,175,0.1)' : 'rgba(255,111,174,0.1)',
                    borderLeft: `3px solid ${t.accent.primary}`,
                  }}>
                    <p style={{
                      fontSize: theme.typography.size.xs,
                      fontWeight: theme.typography.weight.bold,
                      color: t.accent.primary,
                      marginBottom: theme.spacing[2],
                      textTransform: 'uppercase',
                    }}>
                      BentlyAI's Reflection
                    </p>
                    <p style={{
                      fontSize: theme.typography.size.sm,
                      color: t.text.secondary,
                      lineHeight: theme.typography.lineHeight.relaxed,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {entry.analysis}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
