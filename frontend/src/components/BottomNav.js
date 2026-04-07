import React from 'react';
import { useApp } from '../context/AppContext';
import theme, { getThemeColors } from '../lib/theme';

const NAV_ITEMS = [
  { key: 'home', label: 'Today', icon: '🏠' },
  { key: 'chat', label: 'Chat', icon: '💬' },
  { key: 'us', label: 'Us', icon: '💜' },
  { key: 'me', label: 'Me', icon: '👤' },
  { key: 'deeply', label: 'DeeplyUs', icon: '🔒' },
];

export default function BottomNav() {
  const { view, setView, mode } = useApp();
  const t = getThemeColors(mode);

  // Determine which main tab is active
  const getActiveTab = () => {
    if (['home', 'horoscope'].includes(view)) return 'home';
    if (['chat', 'tools'].includes(view)) return 'chat';
    if (['modules', 'trust', 'calendar', 'lists', 'portraits'].includes(view)) return 'us';
    if (['favorites', 'journal', 'profile', 'horoscope'].includes(view)) return 'me';
    if (view === 'deeply') return 'deeply';
    return view;
  };

  const activeTab = getActiveTab();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: mode === 'deeplyus' 
        ? theme.colors.deep.bg.surface 
        : theme.colors.bg.surface,
      borderTop: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      zIndex: 100,
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-around',
        maxWidth: '500px', 
        margin: '0 auto',
        padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            data-testid={`nav-${item.key}`}
            onClick={() => setView(item.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
              borderRadius: theme.radius.lg,
              border: 'none',
              background: activeTab === item.key 
                ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.2)' : 'rgba(255,111,174,0.1)')
                : 'transparent',
              color: activeTab === item.key ? t.accent.primary : t.text.muted,
              cursor: 'pointer',
              transition: `all ${theme.motion.duration.fast}`,
              minWidth: '64px',
            }}
          >
            <span style={{ fontSize: '20px', marginBottom: '2px' }}>{item.icon}</span>
            <span style={{
              fontSize: theme.typography.size.xs,
              fontWeight: activeTab === item.key ? theme.typography.weight.semibold : theme.typography.weight.regular,
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
