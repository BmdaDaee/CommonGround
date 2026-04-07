import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import AuthScreen from './components/AuthScreen';
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
  const { user, loading } = useAuth();
  const { view, setView } = useApp();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Render based on current view
  const renderContent = () => {
    // Today/Home tab
    if (view === 'home') return <HomeScreen />;
    if (view === 'horoscope') return <HoroscopeScreen />;
    
    // Chat tab
    if (view === 'chat') return <ChatScreen />;
    if (view === 'tools') return <ToolsScreen />;
    
    // Us tab (with sub-navigation)
    if (['us', 'modules', 'trust', 'calendar', 'lists', 'portraits'].includes(view)) {
      // Default to modules if just "us"
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
    
    // Me tab (with sub-navigation)
    if (['me', 'favorites', 'journal', 'profile'].includes(view)) {
      // Default to favorites if just "me"
      if (view === 'me') {
        setView('favorites');
        return null;
      }
      
      return (
        <MeScreen>
          {view === 'favorites' && <FavoritesScreen />}
          {view === 'journal' && <JournalScreen />}
        </MeScreen>
      );
    }
    
    // Fallback
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
