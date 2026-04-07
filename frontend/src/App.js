import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import AuthScreen from './components/AuthScreen';
import PairingScreen from './components/PairingScreen';
import ChatScreen from './components/ChatScreen';
import ToolsScreen from './components/ToolsScreen';
import BottomNav from './components/BottomNav';
import './App.css';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FFF4EC',
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>
          CommonGround
        </h1>
        <p style={{ color: '#7A7A7A' }}>Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading, pair } = useAuth();
  const { view } = useApp();

  if (loading) {
    return <LoadingScreen />;
  }

  // Not authenticated
  if (!user) {
    return <AuthScreen />;
  }

  // Authenticated but not paired - show pairing screen
  // Skip pairing for now to allow solo AI chat
  // if (!pair || pair.status !== 'ACTIVE') {
  //   return <PairingScreen />;
  // }

  // Main app with navigation
  return (
    <div style={{ paddingBottom: '80px' }}>
      {view === 'chat' && <ChatScreen />}
      {view === 'tools' && <ToolsScreen />}
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
