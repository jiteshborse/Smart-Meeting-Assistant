import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { NewMeeting } from './pages/NewMeeting';
import { MeetingDetail } from './pages/MeetingDetail';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { useAuthStore } from './stores/authStore';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { syncOfflineMeetings } from './services/syncService';
import { Settings } from './pages/Settings';
import { useEffect } from 'react';
import { AuthCallback } from './pages/AuthCallback';
import { CalendarPage } from './pages/CalendarPage';

function App() {
  const { user } = useAuthStore();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (isOnline) {
      syncOfflineMeetings();
    }
  }, [isOnline]);

  return (
    // <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          user ? <Layout /> : <Navigate to="/login" />
        }>
          <Route index element={<Dashboard />} />
          <Route path="meetings/new" element={<NewMeeting />} />
          <Route path="meeting/:id" element={<MeetingDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="auth/callback" element={<AuthCallback />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
    // </ThemeProvider>
  );
}

export default App;