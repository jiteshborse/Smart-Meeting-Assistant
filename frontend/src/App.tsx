import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { NewMeeting } from './pages/NewMeeting';
import { MeetingDetail } from './pages/MeetingDetail';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { useAuthStore } from './stores/authStore';

function App() {
  const { user } = useAuthStore();

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
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
    // </ThemeProvider>
  );
}

export default App;