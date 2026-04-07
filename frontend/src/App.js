import React, { useEffect } from 'react';
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
import LoveLanguageScreen from './components/LoveLanguageScreen';
import PortraitsScreen from './components/PortraitsScreen';
import AstrologyScreen from './components/AstrologyScreen';
import ProfileScreen from './components/ProfileScreen';
import PartnerChatScreen from './components/PartnerChatScreen';
import SharedPlaylistScreen from './components/SharedPlaylistScreen';
import MilestonesScreen from './components/MilestonesScreen';
import AvatarScreen from './components/AvatarScreen';
import WeeklyReportScreen from './components/WeeklyReportScreen';
import UsScreen, { MeScreen } from './components/SubNav';
import BottomNav from './components/BottomNav';
import './App.css';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#FFF4EC', fontFamily: "'Source Sans 3', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>CommonGround</h1>
        <p style={{ color: '#7A7A7A' }}>Powered by BentlyAI</p>
      </div>
    </div>
  );
}

function MainApp() {
  const { view, setView } = useApp();

  useEffect(() => {
    if (view === 'us') setView('modules');
    if (view === 'me') setView('favorites');
  }, [view, setView]);

  const renderContent = () => {
    if (view === 'home') return <HomeScreen />;
    if (view === 'chat') return <ChatScreen />;
    if (view === 'tools') return <ToolsScreen />;
    if (view === 'deeply') return <DeeplyUsScreen />;
    if (view === 'love-language') return <LoveLanguageScreen />;
    if (view === 'partner-chat') return <PartnerChatScreen />;
    if (view === 'weekly-report') return <WeeklyReportScreen />;

    // Us tab
    if (['modules', 'trust', 'calendar', 'lists', 'portraits', 'astrology', 'playlist', 'milestones'].includes(view)) {
      return (
        <UsScreen>
          {view === 'modules' && <ModulesScreen />}
          {view === 'trust' && <TrustScreen />}
          {view === 'calendar' && <CalendarScreen />}
          {view === 'lists' && <ListsScreen />}
          {view === 'portraits' && <PortraitsScreen />}
          {view === 'astrology' && <AstrologyScreen />}
          {view === 'playlist' && <SharedPlaylistScreen />}
          {view === 'milestones' && <MilestonesScreen />}
        </UsScreen>
      );
    }

    // Me tab
    if (['favorites', 'journal', 'profile', 'horoscope', 'love-language', 'avatar'].includes(view)) {
      return (
        <MeScreen>
          {view === 'favorites' && <FavoritesScreen />}
          {view === 'journal' && <JournalScreen />}
          {view === 'horoscope' && <HoroscopeScreen />}
          {view === 'love-language' && <LoveLanguageScreen />}
          {view === 'profile' && <ProfileScreen />}
          {view === 'avatar' && <AvatarScreen />}
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

function AppContent() {
  const { user, profile, pair, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;
  if (!profile?.onboarding_complete) return <OnboardingScreen />;
  if (!pair) return <PairingScreen />;
  return <MainApp />;
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
