import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import PairingScreen from './components/PairingScreen';
import HomeScreen from './components/HomeScreen';
import HoroscopeScreen from './components/HoroscopeScreen';
import ChatScreen from './components/ChatScreen';
import ToolsScreen from './components/ToolsScreen';
import TrustScreen from './components/TrustScreen';
import FavoritesScreen from './components/FavoritesScreen';
import CalendarScreen from './components/CalendarScreen';
import ListsScreen from './components/ListsScreen';
import JournalScreen from './components/JournalScreen';
import ModulesScreen from './components/ModulesScreen';
import DeeplyUsScreen from './components/DeeplyUsScreen';
import UsScreen, { MeScreen } from './components/SubNav';
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
        <p style={{ color: '#7A7A7A' }}>Powered by BentlyAI</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, profile, pair, loading } = useAuth();
  const { view, setView } = useApp();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Onboarding: user logged in but hasn't completed profile setup
  if (!profile?.onboarding_complete) {
    return <OnboardingScreen />;
  }

  // Pairing: user onboarded but not paired yet
  if (!pair) {
    return <PairingScreen />;
  }

  // Main app — user is logged in, onboarded, and paired
  const renderContent = () => {
    if (view === 'home') return <HomeScreen />;
    if (view === 'chat') return <ChatScreen />;
    if (view === 'tools') return <ToolsScreen />;
    if (view === 'deeply') return <DeeplyUsScreen />;

    // Us tab
    if (['us', 'modules', 'trust', 'calendar', 'lists', 'portraits'].includes(view)) {
      if (view === 'us') {
        setView('modules');
        return null;
      }
      return (
        <UsScreen>
          {view === 'modules' && <ModulesScreen />}
          {view === 'trust' && <TrustScreen />}
          {view === 'calendar' && <CalendarScreen />}
          {view === 'lists' && <ListsScreen />}
        </UsScreen>
      );
    }

    // Me tab
    if (['me', 'favorites', 'journal', 'profile', 'horoscope'].includes(view)) {
      if (view === 'me') {
        setView('favorites');
        return null;
      }
      return (
        <MeScreen>
          {view === 'favorites' && <FavoritesScreen />}
          {view === 'journal' && <JournalScreen />}
          {view === 'horoscope' && <HoroscopeScreen />}
        </MeScreen>
      );
    }

    return <HomeScreen />;
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {renderContent()}
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
