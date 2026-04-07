import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function TrustScreen() {
  const { mode, vibe } = useApp();
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('');
  const t = getThemeColors(mode);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const { data } = await api.getTrustExercises();
      setExercises(data.exercises || []);
    } catch (err) {
      console.error('Failed to load exercises:', err);
    }
  };

  const handleGetAdvice = async (exercise) => {
    setSelectedExercise(exercise);
    setLoading(true);
    setAdvice(null);
    
    try {
      const { data } = await api.getTrustAdvice(exercise.id, context, vibe);
      setAdvice(data.advice);
    } catch (err) {
      console.error('Failed to get advice:', err);
      setAdvice('Take your time with this exercise. Create a calm, private space. The goal is connection, not perfection.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      default: return t.accent.primary;
    }
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
        <div style={{ marginBottom: theme.spacing[6] }}>
          <h1 style={{
            fontSize: theme.typography.size.display,
            fontWeight: theme.typography.weight.bold,
            color: t.text.primary,
            marginBottom: theme.spacing[2],
          }}>
            Trust Building
          </h1>
          <p style={{
            fontSize: theme.typography.size.md,
            color: t.text.secondary,
          }}>
            Exercises to strengthen your connection
          </p>
        </div>

        {/* Selected Exercise Detail */}
        {selectedExercise && (
          <div data-testid="selected-exercise" style={{
            background: mode === 'deeplyus' 
              ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})`
              : `linear-gradient(135deg, ${theme.colors.gradient.emotional.start}, ${theme.colors.gradient.emotional.end})`,
            borderRadius: theme.radius.xl,
            padding: theme.spacing[6],
            marginBottom: theme.spacing[5],
            boxShadow: mode === 'deeplyus' ? theme.shadow.deep.glow : theme.shadow.card,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing[3] }}>
              <h2 style={{
                fontSize: theme.typography.size.xl,
                fontWeight: theme.typography.weight.bold,
                color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
              }}>
                {selectedExercise.title}
              </h2>
              <button
                onClick={() => { setSelectedExercise(null); setAdvice(null); }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: theme.radius.round,
                  padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
                  color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
                  cursor: 'pointer',
                  fontSize: theme.typography.size.sm,
                }}
              >
                Close
              </button>
            </div>
            
            <p style={{
              fontSize: theme.typography.size.md,
              color: mode === 'deeplyus' ? 'rgba(255,255,255,0.9)' : theme.colors.text.secondary,
              marginBottom: theme.spacing[4],
              lineHeight: theme.typography.lineHeight.relaxed,
            }}>
              {selectedExercise.description}
            </p>

            <div style={{ display: 'flex', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
              <span style={{
                padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
                borderRadius: theme.radius.round,
                background: 'rgba(255,255,255,0.2)',
                fontSize: theme.typography.size.xs,
                color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
              }}>
                {selectedExercise.duration}
              </span>
              <span style={{
                padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
                borderRadius: theme.radius.round,
                background: getDifficultyColor(selectedExercise.difficulty),
                fontSize: theme.typography.size.xs,
                color: '#FFFFFF',
              }}>
                {selectedExercise.difficulty}
              </span>
            </div>

            {/* Context Input */}
            <div style={{ marginBottom: theme.spacing[4] }}>
              <label style={{
                fontSize: theme.typography.size.sm,
                color: mode === 'deeplyus' ? 'rgba(255,255,255,0.7)' : theme.colors.text.muted,
                display: 'block',
                marginBottom: theme.spacing[2],
              }}>
                Any context for BentlyAI? (optional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., We've been struggling with communication lately..."
                rows={3}
                style={{
                  width: '100%',
                  padding: theme.spacing[3],
                  borderRadius: theme.radius.lg,
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
                  fontSize: theme.typography.size.sm,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: theme.typography.fontFamily.primary,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {!advice && !loading && (
              <button
                data-testid="get-advice-btn"
                onClick={() => handleGetAdvice(selectedExercise)}
                style={{
                  padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
                  borderRadius: theme.radius.round,
                  border: 'none',
                  background: '#FFFFFF',
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.semibold,
                  cursor: 'pointer',
                }}
              >
                Get BentlyAI Guidance
              </button>
            )}

            {loading && (
              <p style={{
                fontSize: theme.typography.size.sm,
                color: mode === 'deeplyus' ? 'rgba(255,255,255,0.7)' : theme.colors.text.muted,
              }}>
                BentlyAI is thinking...
              </p>
            )}

            {advice && (
              <div data-testid="trust-advice" style={{
                marginTop: theme.spacing[4],
                padding: theme.spacing[4],
                borderRadius: theme.radius.lg,
                background: 'rgba(255,255,255,0.15)',
              }}>
                <p style={{
                  fontSize: theme.typography.size.xs,
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: theme.spacing[2],
                  textTransform: 'uppercase',
                  fontWeight: theme.typography.weight.bold,
                }}>
                  BentlyAI's Guidance
                </p>
                <p style={{
                  fontSize: theme.typography.size.sm,
                  lineHeight: theme.typography.lineHeight.relaxed,
                  color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
                  whiteSpace: 'pre-wrap',
                }}>
                  {advice}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Exercise List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          {exercises.map((exercise) => (
            <button
              key={exercise.id}
              data-testid={`exercise-${exercise.id}`}
              onClick={() => { setSelectedExercise(exercise); setAdvice(null); setContext(''); }}
              style={{
                padding: theme.spacing[4],
                borderRadius: theme.radius.lg,
                border: selectedExercise?.id === exercise.id 
                  ? `2px solid ${t.accent.primary}`
                  : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
                textAlign: 'left',
                cursor: 'pointer',
                transition: `all ${theme.motion.duration.fast}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[2] }}>
                <h3 style={{
                  fontSize: theme.typography.size.md,
                  fontWeight: theme.typography.weight.semibold,
                  color: t.text.primary,
                  margin: 0,
                }}>
                  {exercise.title}
                </h3>
                <span style={{
                  padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                  borderRadius: theme.radius.round,
                  background: getDifficultyColor(exercise.difficulty),
                  fontSize: theme.typography.size.xs,
                  color: '#FFFFFF',
                }}>
                  {exercise.difficulty}
                </span>
              </div>
              <p style={{
                fontSize: theme.typography.size.sm,
                color: t.text.secondary,
                margin: 0,
                marginBottom: theme.spacing[2],
              }}>
                {exercise.description}
              </p>
              <span style={{
                fontSize: theme.typography.size.xs,
                color: t.text.muted,
              }}>
                {exercise.duration}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
