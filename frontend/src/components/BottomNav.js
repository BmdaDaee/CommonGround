import React from 'react';
import { useApp } from '../context/AppContext';
import { House, ChatCircle, UsersThree, User, LockKey } from '@phosphor-icons/react';
import theme from '../lib/theme';

const NAV_ITEMS = [
  { key: 'home', label: 'TODAY', icon: House },
  { key: 'chat', label: 'CHAT', icon: ChatCircle },
  { key: 'us', label: 'US', icon: UsersThree },
  { key: 'me', label: 'ME', icon: User },
  { key: 'deeply', label: 'DEEPLY', icon: LockKey },
];

export default function BottomNav() {
  const { view, setView } = useApp();

  const getActiveTab = () => {
    if (['modules', 'trust', 'calendar', 'lists', 'portraits', 'astrology', 'playlist', 'milestones'].includes(view)) return 'us';
    if (['favorites', 'journal', 'profile', 'horoscope', 'love-language', 'avatar'].includes(view)) return 'me';
    if (view === 'deeply') return 'deeply';
    if (view === 'chat') return 'chat';
    return 'home';
  };

  const active = getActiveTab();

  return (
    <div data-testid="bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(5,5,5,0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid #222',
      padding: `${theme.spacing[2]} 0 env(safe-area-inset-bottom, ${theme.spacing[2]})`,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        maxWidth: '480px', margin: '0 auto',
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              data-testid={`nav-${item.key}`}
              onClick={() => setView(item.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '2px', padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                background: 'transparent', border: 'none', cursor: 'pointer',
                position: 'relative',
              }}
            >
              <Icon
                size={22}
                weight={isActive ? 'fill' : 'regular'}
                color={isActive ? '#FF3333' : '#555560'}
              />
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                fontFamily: theme.typography.fontFamily.heading,
                color: isActive ? '#FF3333' : '#555560',
                transition: `color ${theme.motion.duration.fast}`,
              }}>
                {item.label}
              </span>
              {/* Active indicator bar */}
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: '-2px',
                  width: '20px', height: '2px',
                  background: '#FF3333',
                  borderRadius: '1px',
                  boxShadow: '0 0 8px rgba(255,51,51,0.6)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
