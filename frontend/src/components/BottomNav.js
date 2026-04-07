import React from 'react';
import { useApp } from '../context/AppContext';
import theme, { getThemeColors } from '../lib/theme';

const NAV_ITEMS = [
  { key: 'chat', label: 'Chat', icon: '💬' },
  { key: 'tools', label: 'Tools', icon: '⚡' },
];

export default function BottomNav() {
  const { view, setView, mode } = useApp();
  const t = getThemeColors(mode);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      padding: theme.spacing[3],
      background: mode === 'deeplyus' 
        ? theme.colors.deep.bg.surface 
        : theme.colors.bg.surface,
      borderTop: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', gap: theme.spacing[2] }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            data-testid={`nav-${item.key}`}
            onClick={() => setView(item.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: `${theme.spacing[2]} ${theme.spacing[5]}`,
              borderRadius: theme.radius.lg,
              border: 'none',
              background: view === item.key 
                ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.2)' : 'rgba(255,111,174,0.1)')
                : 'transparent',
              color: view === item.key ? t.accent.primary : t.text.muted,
              cursor: 'pointer',
              transition: `all ${theme.motion.duration.fast}`,
            }}
          >
            <span style={{ fontSize: '20px', marginBottom: '2px' }}>{item.icon}</span>
            <span style={{
              fontSize: theme.typography.size.xs,
              fontWeight: view === item.key ? theme.typography.weight.semibold : theme.typography.weight.regular,
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
