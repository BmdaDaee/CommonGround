import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import theme, { getThemeColors } from '../lib/theme';

// Sub-navigation for Us tab
export default function UsScreen({ children }) {
  const { view, setView, mode } = useApp();
  const t = getThemeColors(mode);

  const subTabs = [
    { key: 'modules', label: 'Pathways', icon: '✨' },
    { key: 'trust', label: 'Trust', icon: '💜' },
    { key: 'calendar', label: 'Calendar', icon: '📅' },
    { key: 'lists', label: 'Lists', icon: '📝' },
    { key: 'portraits', label: 'Portraits', icon: '🎨' },
    { key: 'astrology', label: 'Astrology', icon: '🌙' },
  ];

  return (
    <div>
      {/* Sub-navigation */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
        padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
        borderBottom: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      }}>
        <div style={{
          display: 'flex',
          gap: theme.spacing[2],
          overflowX: 'auto',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          {subTabs.map(tab => (
            <button
              key={tab.key}
              data-testid={`us-tab-${tab.key}`}
              onClick={() => setView(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2],
                padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                borderRadius: theme.radius.round,
                border: view === tab.key 
                  ? `2px solid ${t.accent.primary}` 
                  : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                background: view === tab.key
                  ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.2)' : 'rgba(255,111,174,0.1)')
                  : 'transparent',
                color: view === tab.key ? t.accent.primary : t.text.secondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.medium,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

// Sub-navigation for Me tab
export function MeScreen({ children }) {
  const { view, setView, mode } = useApp();
  const t = getThemeColors(mode);

  const subTabs = [
    { key: 'favorites', label: 'Favorites', icon: '❤️' },
    { key: 'journal', label: 'Journal', icon: '📝' },
    { key: 'horoscope', label: 'Stars', icon: '✨' },
    { key: 'love-language', label: 'Love Language', icon: '💕' },
    { key: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div>
      {/* Sub-navigation */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
        padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
        borderBottom: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      }}>
        <div style={{
          display: 'flex',
          gap: theme.spacing[2],
          overflowX: 'auto',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          {subTabs.map(tab => (
            <button
              key={tab.key}
              data-testid={`me-tab-${tab.key}`}
              onClick={() => setView(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2],
                padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                borderRadius: theme.radius.round,
                border: view === tab.key 
                  ? `2px solid ${t.accent.primary}` 
                  : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                background: view === tab.key
                  ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.2)' : 'rgba(255,111,174,0.1)')
                  : 'transparent',
                color: view === tab.key ? t.accent.primary : t.text.secondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.medium,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
