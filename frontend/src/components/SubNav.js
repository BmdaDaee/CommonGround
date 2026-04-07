import React from 'react';
import { useApp } from '../context/AppContext';
import theme from '../lib/theme';

function SubNavBar({ tabs }) {
  const { view, setView } = useApp();

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(5,5,5,0.85)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid #222',
      padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
      overflowX: 'auto',
      display: 'flex', gap: theme.spacing[2],
      scrollbarWidth: 'none',
    }}>
      {tabs.map((tab) => {
        const isActive = view === tab.key;
        return (
          <button
            key={tab.key}
            data-testid={`subnav-${tab.key}`}
            onClick={() => setView(tab.key)}
            style={{
              padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
              borderRadius: theme.radius.none,
              border: isActive ? '1px solid #D4AF37' : '1px solid #1F1F1F',
              background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent',
              color: isActive ? '#D4AF37' : '#9CA3AF',
              fontSize: theme.typography.size.xs,
              fontWeight: 700,
              fontFamily: theme.typography.fontFamily.heading,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: `all ${theme.motion.duration.fast}`,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function UsScreen({ children }) {
  const tabs = [
    { key: 'modules', label: 'PATHWAYS' },
    { key: 'trust', label: 'TRUST' },
    { key: 'calendar', label: 'CALENDAR' },
    { key: 'lists', label: 'LISTS' },
    { key: 'portraits', label: 'PORTRAITS' },
    { key: 'astrology', label: 'ASTROLOGY' },
    { key: 'playlist', label: 'PLAYLIST' },
    { key: 'milestones', label: 'TIMELINE' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      <SubNavBar tabs={tabs} />
      {children}
    </div>
  );
}

export function MeScreen({ children }) {
  const tabs = [
    { key: 'favorites', label: 'FAVORITES' },
    { key: 'journal', label: 'JOURNAL' },
    { key: 'horoscope', label: 'STARS' },
    { key: 'love-language', label: 'LOVE LANG' },
    { key: 'avatar', label: 'AVATAR' },
    { key: 'profile', label: 'PROFILE' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      <SubNavBar tabs={tabs} />
      {children}
    </div>
  );
}
