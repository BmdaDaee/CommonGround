import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function ModulesScreen() {
  const { mode, vibe } = useApp();
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const t = getThemeColors(mode);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [modulesRes, progressRes] = await Promise.all([
        api.getModules(),
        api.getModuleProgress()
      ]);
      setModules(modulesRes.data.modules || []);
      setProgress(progressRes.data.progress || []);
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (moduleId) => {
    return progress.find(p => p.module_id === moduleId);
  };

  const handleStartModule = async (module) => {
    try {
      await api.startModule(module.id);
      await loadData();
      setActiveModule(module);
      handleGenerateExercise(module, 1);
    } catch (err) {
      console.error('Failed to start module:', err);
    }
  };

  const handleGenerateExercise = async (module, day) => {
    setLoadingExercise(true);
    try {
      const { data } = await api.generateExercise(module.id, day);
      setExercise({ ...data, module, day });
    } catch (err) {
      console.error('Failed to generate exercise:', err);
    } finally {
      setLoadingExercise(false);
    }
  };

  const handleCompleteDay = async () => {
    if (!activeModule || !exercise) return;
    try {
      await api.completeDay(activeModule.id, exercise.day);
      await loadData();
      
      const moduleData = modules.find(m => m.id === activeModule.id);
      if (exercise.day < moduleData.days) {
        handleGenerateExercise(activeModule, exercise.day + 1);
      } else {
        setExercise(null);
        setActiveModule(null);
      }
    } catch (err) {
      console.error('Failed to complete day:', err);
    }
  };

  const getIcon = (iconName) => {
    const icons = { sparkles: '✨', heart: '💜', message: '💬', flame: '🔥', shield: '🛡️' };
    return icons[iconName] || '⭐';
  };

  if (activeModule && exercise) {
    return (
      <div style={{
        minHeight: '100vh',
        background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
        padding: theme.spacing[4],
        paddingBottom: '100px',
        fontFamily: theme.typography.fontFamily.primary,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Back Button */}
          <button
            onClick={() => { setActiveModule(null); setExercise(null); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: t.text.muted,
              fontSize: theme.typography.size.sm,
              cursor: 'pointer',
              marginBottom: theme.spacing[4],
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[2],
            }}
          >
            ← Back to Pathways
          </button>

          {/* Module Header */}
          <div style={{
            background: mode === 'deeplyus' 
              ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})`
              : `linear-gradient(135deg, ${theme.colors.gradient.emotional.start}, ${theme.colors.gradient.emotional.end})`,
            borderRadius: theme.radius.xl,
            padding: theme.spacing[5],
            marginBottom: theme.spacing[5],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[2] }}>
              <span style={{ fontSize: '28px' }}>{getIcon(activeModule.icon)}</span>
              <h1 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary }}>
                {activeModule.title}
              </h1>
            </div>
            <p style={{ fontSize: theme.typography.size.sm, color: mode === 'deeplyus' ? 'rgba(255,255,255,0.7)' : theme.colors.text.secondary }}>
              Day {exercise.day} of {activeModule.days}
            </p>
            
            {/* Progress Bar */}
            <div style={{
              marginTop: theme.spacing[3],
              height: '6px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: theme.radius.round,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(exercise.day / activeModule.days) * 100}%`,
                height: '100%',
                background: '#FFFFFF',
                borderRadius: theme.radius.round,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Exercise */}
          {loadingExercise ? (
            <div style={{ textAlign: 'center', padding: theme.spacing[8], color: t.text.muted }}>
              <p>BentlyAI is preparing today's exercise...</p>
            </div>
          ) : (
            <div style={{
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
              borderRadius: theme.radius.xl,
              padding: theme.spacing[5],
              boxShadow: theme.shadow.card,
            }}>
              <h2 style={{ fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.semibold, color: t.text.primary, marginBottom: theme.spacing[4] }}>
                Today's Exercise
              </h2>
              <div style={{
                fontSize: theme.typography.size.md,
                color: t.text.secondary,
                lineHeight: theme.typography.lineHeight.relaxed,
                whiteSpace: 'pre-wrap',
              }}>
                {exercise.exercise}
              </div>
              
              <button
                data-testid="complete-day-btn"
                onClick={handleCompleteDay}
                style={{
                  marginTop: theme.spacing[6],
                  width: '100%',
                  padding: theme.spacing[4],
                  borderRadius: theme.radius.lg,
                  border: 'none',
                  background: t.accent.primary,
                  color: '#FFFFFF',
                  fontSize: theme.typography.size.md,
                  fontWeight: theme.typography.weight.semibold,
                  cursor: 'pointer',
                }}
              >
                {exercise.day < activeModule.days ? 'Complete & Continue Tomorrow' : 'Complete Pathway 🎉'}
              </button>
            </div>
          )}
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
        <div style={{ marginBottom: theme.spacing[5] }}>
          <h1 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, marginBottom: theme.spacing[1] }}>
            Growth Pathways
          </h1>
          <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted }}>
            Guided journeys to strengthen your relationship
          </p>
        </div>

        {loading ? (
          <p style={{ color: t.text.muted }}>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
            {modules.map(module => {
              const prog = getModuleProgress(module.id);
              const isStarted = !!prog;
              const completedDays = prog?.completed_days?.length || 0;
              const isComplete = completedDays >= module.days;
              
              return (
                <div
                  key={module.id}
                  data-testid={`module-${module.id}`}
                  style={{
                    background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
                    borderRadius: theme.radius.xl,
                    padding: theme.spacing[5],
                    boxShadow: theme.shadow.soft,
                    border: isStarted && !isComplete ? `2px solid ${t.accent.primary}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing[4] }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: theme.radius.lg,
                      background: mode === 'deeplyus' 
                        ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})`
                        : `linear-gradient(135deg, ${theme.colors.gradient.emotional.start}, ${theme.colors.gradient.emotional.end})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0,
                    }}>
                      {isComplete ? '✓' : getIcon(module.icon)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold, color: t.text.primary, marginBottom: theme.spacing[1] }}>
                        {module.title}
                      </h3>
                      <p style={{ fontSize: theme.typography.size.sm, color: t.text.secondary, marginBottom: theme.spacing[2] }}>
                        {module.description}
                      </p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing[2], marginBottom: theme.spacing[3] }}>
                        <span style={{
                          padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                          borderRadius: theme.radius.round,
                          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          fontSize: theme.typography.size.xs,
                          color: t.text.muted,
                        }}>
                          {module.days} days
                        </span>
                        {isStarted && (
                          <span style={{
                            padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                            borderRadius: theme.radius.round,
                            background: isComplete ? t.accent.highlight : t.accent.primary,
                            fontSize: theme.typography.size.xs,
                            color: '#FFFFFF',
                          }}>
                            {isComplete ? 'Complete!' : `Day ${completedDays + 1}/${module.days}`}
                          </span>
                        )}
                      </div>
                      
                      {/* Outcomes */}
                      <div style={{ marginBottom: theme.spacing[3] }}>
                        {module.outcomes.map((outcome, idx) => (
                          <span key={idx} style={{ fontSize: theme.typography.size.xs, color: t.text.muted, marginRight: theme.spacing[2] }}>
                            ✓ {outcome}
                          </span>
                        ))}
                      </div>
                      
                      {!isComplete && (
                        <button
                          onClick={() => {
                            setActiveModule(module);
                            if (isStarted) {
                              handleGenerateExercise(module, completedDays + 1);
                            } else {
                              handleStartModule(module);
                            }
                          }}
                          style={{
                            padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                            borderRadius: theme.radius.round,
                            border: 'none',
                            background: isStarted ? t.accent.primary : t.accent.secondary,
                            color: '#FFFFFF',
                            fontSize: theme.typography.size.sm,
                            fontWeight: theme.typography.weight.semibold,
                            cursor: 'pointer',
                          }}
                        >
                          {isStarted ? 'Continue' : 'Start Pathway'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
