import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

const TOOLS = [
  { key: 'draft_reply', label: 'Draft Reply', description: 'Craft a thoughtful response' },
  { key: 'vent_analysis', label: 'Break It Down', description: 'Understand what\'s happening' },
  { key: 'date_plan', label: 'Date Plan', description: 'Plan meaningful time together' },
  { key: 'spark', label: 'Spark', description: 'Start a real conversation' },
  { key: 'note', label: 'Note', description: 'Write something from the heart' },
];

function VibeDial({ vibe, onSelect, mode }) {
  const t = getThemeColors(mode);
  const vibes = [
    { key: 'soft', label: 'Soft' },
    { key: 'realtalk', label: 'Real Talk' },
    { key: 'savage', label: 'Savage' },
  ];

  return (
    <div style={{ display: 'flex', gap: theme.spacing[2] }}>
      {vibes.map((v) => (
        <button
          key={v.key}
          data-testid={`tools-vibe-${v.key}`}
          onClick={() => onSelect(v.key)}
          style={{
            padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
            borderRadius: theme.radius.round,
            border: vibe === v.key 
              ? `2px solid ${t.accent.primary}` 
              : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            background: vibe === v.key 
              ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.2)' : 'rgba(255,111,174,0.1)') 
              : 'transparent',
            color: vibe === v.key ? t.accent.primary : t.text.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.semibold,
            cursor: 'pointer',
            transition: `all ${theme.motion.duration.fast}`,
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

export default function ToolsScreen() {
  const { mode, vibe, setVibe } = useApp();
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const t = getThemeColors(mode);

  const handleRunTool = async (toolKey) => {
    if (!context.trim()) return;
    
    setLoading(true);
    setSelectedTool(toolKey);
    setOutput('');
    
    try {
      const { data } = await api.aiTask(toolKey, context, vibe);
      setOutput(data.output || 'No output received');
    } catch (err) {
      console.error('Tool error:', err);
      setOutput('Something went wrong. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: mode === 'deeplyus' 
        ? theme.colors.deep.bg.primary 
        : theme.colors.bg.primary,
      fontFamily: theme.typography.fontFamily.primary,
      padding: theme.spacing[4],
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: theme.spacing[6] }}>
          <h1 style={{
            fontSize: theme.typography.size.xl,
            fontWeight: theme.typography.weight.bold,
            color: t.text.primary,
            marginBottom: theme.spacing[2],
          }}>
            Tools
          </h1>
          <p style={{
            fontSize: theme.typography.size.sm,
            color: t.text.secondary,
            marginBottom: theme.spacing[4],
          }}>
            Prototype features powered by Shantell's voice. Paste text, pick a tool, get something usable.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
            <span style={{ fontSize: theme.typography.size.sm, color: t.text.muted }}>Vibe:</span>
            <VibeDial vibe={vibe} onSelect={setVibe} mode={mode} />
          </div>
        </div>

        {/* Context Input */}
        <div style={{ marginBottom: theme.spacing[5] }}>
          <label style={{
            fontSize: theme.typography.size.sm,
            color: t.text.muted,
            display: 'block',
            marginBottom: theme.spacing[2],
          }}>
            What's the situation?
          </label>
          <textarea
            data-testid="tools-context-input"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder='Example: "She said I always disappear when we argue..."'
            rows={5}
            style={{
              width: '100%',
              padding: theme.spacing[4],
              borderRadius: theme.radius.lg,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
              color: t.text.primary,
              fontSize: theme.typography.size.md,
              resize: 'vertical',
              outline: 'none',
              fontFamily: theme.typography.fontFamily.primary,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tool Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: theme.spacing[3],
          marginBottom: theme.spacing[5],
        }}>
          {TOOLS.map((tool) => (
            <button
              key={tool.key}
              data-testid={`tool-${tool.key}`}
              onClick={() => handleRunTool(tool.key)}
              disabled={loading || !context.trim()}
              style={{
                padding: theme.spacing[4],
                borderRadius: theme.radius.lg,
                border: selectedTool === tool.key 
                  ? `2px solid ${t.accent.primary}`
                  : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                background: selectedTool === tool.key
                  ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.1)' : 'rgba(255,111,174,0.1)')
                  : (mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface),
                color: t.text.primary,
                textAlign: 'left',
                cursor: loading || !context.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !context.trim() ? 0.5 : 1,
                transition: `all ${theme.motion.duration.fast}`,
              }}
            >
              <div style={{
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.semibold,
                marginBottom: theme.spacing[1],
              }}>
                {tool.label}
              </div>
              <div style={{
                fontSize: theme.typography.size.xs,
                color: t.text.muted,
              }}>
                {tool.description}
              </div>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            padding: theme.spacing[4],
            borderRadius: theme.radius.lg,
            background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
            textAlign: 'center',
            marginBottom: theme.spacing[4],
          }}>
            <div style={{
              fontSize: theme.typography.size.sm,
              color: t.text.muted,
            }}>
              Thinking...
            </div>
          </div>
        )}

        {/* Output */}
        {output && !loading && (
          <div data-testid="tools-output" style={{
            padding: theme.spacing[5],
            borderRadius: theme.radius.lg,
            background: mode === 'deeplyus' 
              ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})`
              : `linear-gradient(135deg, ${theme.colors.gradient.emotional.start}, ${theme.colors.gradient.emotional.end})`,
            boxShadow: mode === 'deeplyus' ? theme.shadow.deep.glow : theme.shadow.card,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing[3] }}>
              <div style={{
                fontSize: theme.typography.size.xs,
                fontWeight: theme.typography.weight.bold,
                color: mode === 'deeplyus' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Output
              </div>
              <button
                data-testid="copy-output-btn"
                onClick={copyToClipboard}
                style={{
                  padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
                  borderRadius: theme.radius.md,
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
                  fontSize: theme.typography.size.xs,
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
            <p style={{
              margin: 0,
              fontSize: theme.typography.size.md,
              lineHeight: theme.typography.lineHeight.relaxed,
              color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
              whiteSpace: 'pre-wrap',
            }}>
              {output}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
