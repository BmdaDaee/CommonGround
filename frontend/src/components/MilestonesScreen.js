import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

const CATEGORIES = [
  { key: 'first', label: 'Firsts', color: '#E63946' },
  { key: 'anniversary', label: 'Anniversaries', color: '#A78BFA' },
  { key: 'trip', label: 'Trips', color: '#14B8A6' },
  { key: 'milestone', label: 'Milestones', color: '#F59E0B' },
  { key: 'custom', label: 'Other', color: '#6366F1' },
];

export default function MilestonesScreen() {
  const { mode } = useApp();
  const [milestones, setMilestones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [loading, setLoading] = useState(true);
  const t = getThemeColors(mode);

  useEffect(() => { loadMilestones(); }, []);

  const loadMilestones = async () => {
    try {
      const { data } = await api.getMilestones();
      setMilestones(data.milestones || []);
    } catch (err) {
      console.error('Failed to load milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!title.trim() || !date) return;
    try {
      const { data } = await api.createMilestone(title.trim(), date, description.trim() || null, category);
      setMilestones(prev => [...prev, data.milestone].sort((a, b) => a.date.localeCompare(b.date)));
      setTitle(''); setDate(''); setDescription(''); setCategory('custom'); setShowForm(false);
    } catch (err) {
      console.error('Failed to add milestone:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteMilestone(id);
      setMilestones(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const inputStyle = {
    width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md,
    border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
    background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    color: t.text.primary, fontSize: theme.typography.size.sm, outline: 'none', boxSizing: 'border-box',
    fontFamily: theme.typography.fontFamily.primary,
  };

  const getCatColor = (cat) => CATEGORIES.find(c => c.key === cat)?.color || '#6366F1';

  return (
    <div data-testid="milestones-screen" style={{
      padding: theme.spacing[4], paddingBottom: '100px', maxWidth: '600px', margin: '0 auto',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[5] }}>
        <div>
          <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, margin: 0 }}>Our Timeline</h2>
          <p style={{ fontSize: theme.typography.size.xs, color: t.text.muted, margin: 0 }}>Relationship milestones</p>
        </div>
        <button data-testid="add-milestone-toggle-btn" onClick={() => setShowForm(!showForm)} style={{
          padding: `${theme.spacing[2]} ${theme.spacing[4]}`, borderRadius: theme.radius.round, border: 'none',
          background: t.accent.primary, color: '#FFFFFF', fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.semibold, cursor: 'pointer',
        }}>
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <div data-testid="add-milestone-form" style={{
          padding: theme.spacing[4], borderRadius: theme.radius.lg, marginBottom: theme.spacing[5],
          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <input data-testid="milestone-title-input" type="text" placeholder="What happened?" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            <input data-testid="milestone-date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Notes (optional)" value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: theme.spacing[1], flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
                  padding: `${theme.spacing[1]} ${theme.spacing[3]}`, borderRadius: theme.radius.round,
                  border: category === cat.key ? `2px solid ${cat.color}` : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
                  background: category === cat.key ? `${cat.color}20` : 'transparent',
                  color: category === cat.key ? cat.color : t.text.secondary,
                  fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.semibold, cursor: 'pointer',
                }}>
                  {cat.label}
                </button>
              ))}
            </div>
            <button data-testid="add-milestone-submit-btn" onClick={handleAdd} disabled={!title.trim() || !date} style={{
              padding: theme.spacing[3], borderRadius: theme.radius.md, border: 'none',
              background: title.trim() && date ? t.accent.primary : (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
              color: title.trim() && date ? '#FFFFFF' : t.text.muted,
              fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold,
              cursor: title.trim() && date ? 'pointer' : 'not-allowed',
            }}>
              Add Milestone
            </button>
          </div>
        </div>
      )}

      {loading && <p style={{ color: t.text.muted, textAlign: 'center' }}>Loading...</p>}

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        {/* Vertical line */}
        {milestones.length > 0 && (
          <div style={{
            position: 'absolute', left: '8px', top: 0, bottom: 0, width: '2px',
            background: mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          }} />
        )}

        {milestones.map((m) => (
          <div key={m.id} data-testid={`milestone-${m.id}`} style={{ position: 'relative', marginBottom: theme.spacing[4] }}>
            {/* Dot */}
            <div style={{
              position: 'absolute', left: '-20px', top: '6px',
              width: '14px', height: '14px', borderRadius: '50%',
              background: getCatColor(m.category),
              border: `2px solid ${mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary}`,
            }} />
            <div style={{
              padding: theme.spacing[3], borderRadius: theme.radius.md,
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{
                    display: 'inline-block', padding: `1px ${theme.spacing[2]}`, borderRadius: theme.radius.round,
                    background: `${getCatColor(m.category)}20`, color: getCatColor(m.category),
                    fontSize: '10px', fontWeight: theme.typography.weight.bold, textTransform: 'uppercase', marginBottom: theme.spacing[1],
                  }}>
                    {CATEGORIES.find(c => c.key === m.category)?.label || m.category}
                  </span>
                  <h3 style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold, color: t.text.primary, margin: `${theme.spacing[1]} 0` }}>
                    {m.title}
                  </h3>
                  <span style={{ fontSize: theme.typography.size.xs, color: t.text.muted }}>
                    {new Date(m.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  {m.description && <p style={{ fontSize: theme.typography.size.xs, color: t.text.secondary, margin: `${theme.spacing[1]} 0 0`, fontStyle: 'italic' }}>{m.description}</p>}
                </div>
                <button onClick={() => handleDelete(m.id)} style={{ background: 'transparent', border: 'none', color: t.text.muted, cursor: 'pointer', fontSize: theme.typography.size.xs }}>x</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && milestones.length === 0 && (
        <p style={{ color: t.text.muted, textAlign: 'center', marginTop: theme.spacing[8] }}>
          No milestones yet. Start your timeline!
        </p>
      )}
    </div>
  );
}
