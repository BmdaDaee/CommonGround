import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

function UnlockGate({ onUnlock }) {
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    try {
      await api.unlockDeeply();
      onUnlock();
    } catch (err) {
      console.error('Failed to unlock:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="deeply-unlock-gate" style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${theme.colors.deep.bg.primary} 0%, ${theme.colors.deep.bg.secondary} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing[6],
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: theme.radius.round,
          background: 'linear-gradient(135deg, #3B1E5A, #FF6F8F)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          marginBottom: theme.spacing[5],
          boxShadow: theme.shadow.deep.glow,
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: theme.typography.size.display,
          fontWeight: theme.typography.weight.bold,
          color: theme.colors.deep.text.primary,
          marginBottom: theme.spacing[3],
        }}>
          DeeplyUs
        </h1>
        <p style={{
          fontSize: theme.typography.size.md,
          color: theme.colors.deep.text.secondary,
          lineHeight: theme.typography.lineHeight.relaxed,
          marginBottom: theme.spacing[6],
        }}>
          A private space to explore your intimate connection — desires, fantasies, insecurities, and everything in between. No judgment, just you two.
        </p>

        <button
          data-testid="deeply-unlock-btn"
          onClick={handleUnlock}
          disabled={loading}
          style={{
            padding: `${theme.spacing[4]} ${theme.spacing[8]}`,
            borderRadius: theme.radius.round,
            border: 'none',
            background: 'linear-gradient(135deg, #FF8FAF, #4A6CFF)',
            color: '#FFFFFF',
            fontSize: theme.typography.size.lg,
            fontWeight: theme.typography.weight.bold,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: theme.shadow.deep.glow,
            transition: `all ${theme.motion.duration.normal}`,
          }}
        >
          {loading ? 'Unlocking...' : 'Unlock DeeplyUs'}
        </button>

        <p style={{
          marginTop: theme.spacing[4],
          fontSize: theme.typography.size.xs,
          color: theme.colors.deep.text.muted,
        }}>
          Both partners should be comfortable before entering
        </p>
      </div>
    </div>
  );
}

function PromptCard({ prompt, onExplore, mode }) {
  const categoryColors = {
    fantasy: '#FF6F8F',
    desire: '#FF8FAF',
    insecurity: '#4A6CFF',
    exploration: '#F5C76B',
    connection: '#A78BFA',
    aftercare: '#67E8F9',
  };

  return (
    <div data-testid={`deeply-prompt-${prompt.category}`} style={{
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: theme.spacing[3],
    }}>
      <span style={{
        display: 'inline-block',
        padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
        borderRadius: theme.radius.round,
        background: categoryColors[prompt.category] || '#FF8FAF',
        fontSize: '10px',
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: theme.spacing[3],
      }}>
        {prompt.category}
      </span>
      <p style={{
        fontSize: theme.typography.size.md,
        color: theme.colors.deep.text.primary,
        lineHeight: theme.typography.lineHeight.relaxed,
        marginBottom: theme.spacing[3],
      }}>
        {prompt.prompt}
      </p>
      <button
        onClick={() => onExplore(prompt)}
        style={{
          padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
          borderRadius: theme.radius.round,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'transparent',
          color: theme.colors.deep.text.secondary,
          fontSize: theme.typography.size.xs,
          cursor: 'pointer',
          transition: `all ${theme.motion.duration.fast}`,
        }}
      >
        Explore with BentlyAI
      </button>
    </div>
  );
}

function ExerciseCard({ exercise }) {
  const difficultyColors = { Easy: '#10B981', Medium: '#F59E0B', Hard: '#EF4444' };

  return (
    <div data-testid={`deeply-exercise-${exercise.id}`} style={{
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: theme.spacing[3],
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[2] }}>
        <h3 style={{
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
          color: theme.colors.deep.text.primary,
          margin: 0,
        }}>
          {exercise.title}
        </h3>
        <span style={{
          padding: `2px ${theme.spacing[2]}`,
          borderRadius: theme.radius.round,
          background: difficultyColors[exercise.difficulty] || '#F59E0B',
          fontSize: '10px',
          fontWeight: theme.typography.weight.bold,
          color: '#FFFFFF',
        }}>
          {exercise.difficulty}
        </span>
      </div>
      <p style={{
        fontSize: theme.typography.size.sm,
        color: theme.colors.deep.text.secondary,
        lineHeight: theme.typography.lineHeight.relaxed,
        marginBottom: theme.spacing[2],
      }}>
        {exercise.description}
      </p>
      <span style={{
        fontSize: theme.typography.size.xs,
        color: theme.colors.deep.text.muted,
      }}>
        {exercise.duration}
      </span>
    </div>
  );
}

function ItemsList({ items, itemType, onAdd }) {
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setAdding(true);
    await onAdd(itemType, text.trim());
    setText('');
    setAdding(false);
  };

  const typeLabels = {
    fantasy: 'Fantasies',
    desire: 'Desires',
    insecurity: 'Insecurities',
    boundary: 'Boundaries',
    note: 'Notes',
  };

  return (
    <div style={{ marginBottom: theme.spacing[5] }}>
      <h3 style={{
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.deep.text.muted,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: theme.spacing[3],
      }}>
        {typeLabels[itemType] || itemType}
      </h3>

      {items.filter(i => i.item_type === itemType).map((item) => (
        <div key={item.id} style={{
          padding: theme.spacing[3],
          borderRadius: theme.radius.md,
          background: 'rgba(255,255,255,0.04)',
          marginBottom: theme.spacing[2],
          borderLeft: `3px solid ${theme.colors.deep.accent.primary}`,
        }}>
          <p style={{
            fontSize: theme.typography.size.sm,
            color: theme.colors.deep.text.primary,
            margin: 0,
          }}>
            {item.text}
          </p>
          <span style={{
            fontSize: theme.typography.size.xs,
            color: theme.colors.deep.text.muted,
          }}>
            {item.shared_with_partner ? 'Shared' : 'Private'}
          </span>
        </div>
      ))}

      <div style={{ display: 'flex', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
        <input
          data-testid={`deeply-add-${itemType}-input`}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Add a ${itemType}...`}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{
            flex: 1,
            padding: theme.spacing[3],
            borderRadius: theme.radius.md,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.05)',
            color: theme.colors.deep.text.primary,
            fontSize: theme.typography.size.sm,
            outline: 'none',
            fontFamily: theme.typography.fontFamily.primary,
          }}
        />
        <button
          data-testid={`deeply-add-${itemType}-btn`}
          onClick={handleAdd}
          disabled={!text.trim() || adding}
          style={{
            padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
            borderRadius: theme.radius.md,
            border: 'none',
            background: text.trim() ? theme.colors.deep.accent.primary : 'rgba(255,255,255,0.1)',
            color: '#FFFFFF',
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
            cursor: text.trim() && !adding ? 'pointer' : 'not-allowed',
          }}
        >
          {adding ? '...' : 'Add'}
        </button>
      </div>
    </div>
  );
}

export default function DeeplyUsScreen() {
  const { profile, refreshProfile } = useAuth();
  const { setMode } = useApp();
  const [activeTab, setActiveTab] = useState('prompts');
  const [prompts, setPrompts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [items, setItems] = useState([]);
  const [igniteResult, setIgniteResult] = useState(null);
  const [exploreResult, setExploreResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const t = getThemeColors('deeplyus');

  // Ensure mode is set to deeplyus
  useEffect(() => {
    setMode('deeplyus');
    return () => setMode('commonground');
  }, [setMode]);

  // Check if locked
  const isUnlocked = profile?.deeply_unlocked;

  const handleUnlock = async () => {
    await refreshProfile();
  };

  useEffect(() => {
    if (isUnlocked) {
      loadData();
    }
  }, [isUnlocked]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promptsRes, exercisesRes, itemsRes] = await Promise.all([
        api.getDeeplyPrompts().catch(() => ({ data: { prompts: [] } })),
        api.getDeeplyExercises().catch(() => ({ data: { exercises: [] } })),
        api.getDeeplyItems().catch(() => ({ data: { items: [] } })),
      ]);
      setPrompts(promptsRes.data.prompts || []);
      setExercises(exercisesRes.data.exercises || []);
      setItems(itemsRes.data.items || []);
    } catch (err) {
      console.error('Failed to load DeeplyUs data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemType, text) => {
    try {
      const { data } = await api.createDeeplyItem(itemType, text, false);
      setItems(prev => [data.item, ...prev]);
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const handleExplore = async (prompt) => {
    setExploreResult({ loading: true, prompt: prompt.prompt });
    try {
      const { data } = await api.deeplyExplore(prompt.category, prompt.prompt);
      setExploreResult({ loading: false, prompt: prompt.prompt, response: data.response });
    } catch (err) {
      setExploreResult({ loading: false, prompt: prompt.prompt, response: "BentlyAI is taking a moment. Try again." });
    }
  };

  const handleIgnite = async () => {
    setIgniteResult({ loading: true });
    try {
      const { data } = await api.deeplyIgnite('Looking for something intimate tonight', 'realtalk');
      setIgniteResult({ loading: false, suggestion: data.suggestion });
    } catch (err) {
      setIgniteResult({ loading: false, suggestion: "Couldn't generate a suggestion right now." });
    }
  };

  if (!isUnlocked) {
    return <UnlockGate onUnlock={handleUnlock} />;
  }

  const tabs = [
    { key: 'prompts', label: 'Prompts' },
    { key: 'exercises', label: 'Exercises' },
    { key: 'journal', label: 'My Space' },
    { key: 'ignite', label: 'Ignite' },
  ];

  return (
    <div data-testid="deeply-us-screen" style={{
      minHeight: '100vh',
      background: theme.colors.deep.bg.primary,
      fontFamily: theme.typography.fontFamily.primary,
      paddingBottom: '100px',
    }}>
      {/* Header */}
      <div style={{
        padding: theme.spacing[4],
        background: `linear-gradient(135deg, ${theme.colors.deep.bg.primary}, ${theme.colors.deep.bg.secondary})`,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <h1 style={{
          fontSize: theme.typography.size.xl,
          fontWeight: theme.typography.weight.bold,
          color: theme.colors.deep.text.primary,
          marginBottom: theme.spacing[1],
        }}>
          DeeplyUs
        </h1>
        <p style={{
          fontSize: theme.typography.size.xs,
          color: theme.colors.deep.text.muted,
          margin: 0,
        }}>
          Your intimate space
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex',
        gap: theme.spacing[1],
        padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
        overflowX: 'auto',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            data-testid={`deeply-tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
              borderRadius: theme.radius.round,
              border: activeTab === tab.key
                ? `2px solid ${theme.colors.deep.accent.primary}`
                : '1px solid rgba(255,255,255,0.15)',
              background: activeTab === tab.key ? 'rgba(255,143,175,0.15)' : 'transparent',
              color: activeTab === tab.key ? theme.colors.deep.accent.primary : theme.colors.deep.text.secondary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: `all ${theme.motion.duration.fast}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: theme.spacing[4], maxWidth: '600px', margin: '0 auto' }}>
        {loading && (
          <p style={{ color: theme.colors.deep.text.muted, textAlign: 'center' }}>Loading...</p>
        )}

        {/* Prompts Tab */}
        {activeTab === 'prompts' && !loading && (
          <div>
            {exploreResult && (
              <div data-testid="deeply-explore-result" style={{
                padding: theme.spacing[4],
                borderRadius: theme.radius.lg,
                background: 'linear-gradient(135deg, rgba(59,30,90,0.8), rgba(255,111,143,0.3))',
                border: '1px solid rgba(255,143,175,0.3)',
                marginBottom: theme.spacing[5],
                boxShadow: theme.shadow.deep.glow,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[2] }}>
                  <span style={{
                    fontSize: theme.typography.size.xs,
                    fontWeight: theme.typography.weight.bold,
                    color: theme.colors.deep.accent.primary,
                    textTransform: 'uppercase',
                  }}>
                    BentlyAI
                  </span>
                  <button
                    onClick={() => setExploreResult(null)}
                    style={{
                      background: 'transparent', border: 'none', color: theme.colors.deep.text.muted,
                      cursor: 'pointer', fontSize: theme.typography.size.sm,
                    }}
                  >
                    ✕
                  </button>
                </div>
                <p style={{
                  fontSize: theme.typography.size.xs,
                  color: theme.colors.deep.text.muted,
                  marginBottom: theme.spacing[2],
                  fontStyle: 'italic',
                }}>
                  "{exploreResult.prompt}"
                </p>
                {exploreResult.loading ? (
                  <p style={{ color: theme.colors.deep.text.secondary }}>Thinking...</p>
                ) : (
                  <p style={{
                    fontSize: theme.typography.size.sm,
                    color: theme.colors.deep.text.primary,
                    lineHeight: theme.typography.lineHeight.relaxed,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {exploreResult.response}
                  </p>
                )}
              </div>
            )}

            {prompts.map((prompt, i) => (
              <PromptCard key={i} prompt={prompt} onExplore={handleExplore} />
            ))}
            {prompts.length === 0 && !loading && (
              <p style={{ color: theme.colors.deep.text.muted, textAlign: 'center' }}>No prompts loaded yet.</p>
            )}
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && !loading && (
          <div>
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
            {exercises.length === 0 && !loading && (
              <p style={{ color: theme.colors.deep.text.muted, textAlign: 'center' }}>No exercises loaded yet.</p>
            )}
          </div>
        )}

        {/* My Space (Journal) Tab */}
        {activeTab === 'journal' && !loading && (
          <div>
            <p style={{
              fontSize: theme.typography.size.sm,
              color: theme.colors.deep.text.secondary,
              marginBottom: theme.spacing[5],
              lineHeight: theme.typography.lineHeight.relaxed,
            }}>
              Your private space to track desires, fantasies, insecurities, and boundaries. Items marked "Private" are only visible to you.
            </p>
            <ItemsList items={items} itemType="fantasy" onAdd={handleAddItem} />
            <ItemsList items={items} itemType="desire" onAdd={handleAddItem} />
            <ItemsList items={items} itemType="insecurity" onAdd={handleAddItem} />
            <ItemsList items={items} itemType="boundary" onAdd={handleAddItem} />
          </div>
        )}

        {/* Ignite Tab */}
        {activeTab === 'ignite' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              padding: theme.spacing[8],
              borderRadius: theme.radius.xl,
              background: 'linear-gradient(135deg, rgba(59,30,90,0.6), rgba(255,111,143,0.2))',
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: theme.spacing[5],
            }}>
              <h2 style={{
                fontSize: theme.typography.size.xl,
                fontWeight: theme.typography.weight.bold,
                color: theme.colors.deep.text.primary,
                marginBottom: theme.spacing[3],
              }}>
                Tonight's Spark
              </h2>
              <p style={{
                fontSize: theme.typography.size.sm,
                color: theme.colors.deep.text.secondary,
                marginBottom: theme.spacing[5],
              }}>
                Let BentlyAI suggest something intimate for tonight
              </p>

              <button
                data-testid="deeply-ignite-btn"
                onClick={handleIgnite}
                disabled={igniteResult?.loading}
                style={{
                  padding: `${theme.spacing[4]} ${theme.spacing[8]}`,
                  borderRadius: theme.radius.round,
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF8FAF, #4A6CFF)',
                  color: '#FFFFFF',
                  fontSize: theme.typography.size.md,
                  fontWeight: theme.typography.weight.bold,
                  cursor: igniteResult?.loading ? 'not-allowed' : 'pointer',
                  boxShadow: theme.shadow.deep.glow,
                  transition: `all ${theme.motion.duration.normal}`,
                }}
              >
                {igniteResult?.loading ? 'Generating...' : 'Ignite'}
              </button>
            </div>

            {igniteResult && !igniteResult.loading && (
              <div data-testid="deeply-ignite-result" style={{
                padding: theme.spacing[5],
                borderRadius: theme.radius.lg,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,143,175,0.2)',
                textAlign: 'left',
              }}>
                <span style={{
                  fontSize: theme.typography.size.xs,
                  fontWeight: theme.typography.weight.bold,
                  color: theme.colors.deep.accent.primary,
                  textTransform: 'uppercase',
                  marginBottom: theme.spacing[3],
                  display: 'block',
                }}>
                  BentlyAI suggests
                </span>
                <p style={{
                  fontSize: theme.typography.size.md,
                  color: theme.colors.deep.text.primary,
                  lineHeight: theme.typography.lineHeight.relaxed,
                  whiteSpace: 'pre-wrap',
                }}>
                  {igniteResult.suggestion}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
