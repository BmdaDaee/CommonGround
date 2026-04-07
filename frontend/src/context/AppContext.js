import React, { createContext, useContext, useState, useMemo } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [mode, setMode] = useState('commonground'); // commonground | deeplyus
  const [vibe, setVibe] = useState('realtalk'); // soft | realtalk | savage
  const [view, setView] = useState('home'); // home | horoscope | chat | tools | trust | favorites

  const value = useMemo(() => ({
    mode,
    setMode,
    vibe,
    setVibe,
    view,
    setView,
  }), [mode, vibe, view]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
