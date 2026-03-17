import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, RequireAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { Onboarding } from './pages/Onboarding';
import { Admin } from './pages/Admin';
import { Profile } from './pages/Profile';

// Lazy pages (added progressively)
const Schedule = React.lazy(() => import('./pages/Schedule').then(m => ({ default: m.Schedule })));
const Preferences = React.lazy(() => import('./pages/Preferences').then(m => ({ default: m.Preferences })));
const Messages = React.lazy(() => import('./pages/Messages').then(m => ({ default: m.Messages })));

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <React.Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Onboarding — requires auth but not full layout */}
            <Route
              path="/onboarding"
              element={
                <RequireAuth>
                  <Onboarding />
                </RequireAuth>
              }
            />

            {/* Protected app routes */}
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/schedule" replace />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              {/* Legacy redirect */}
              <Route path="/shifts" element={<Navigate to="/schedule" replace />} />
            </Route>
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
