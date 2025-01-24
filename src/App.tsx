import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { ShiftListPage } from './pages/ShiftListPage';
import { ShiftDetailPage } from './pages/ShiftDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/shifts" replace />} />
            <Route
              path="/shifts"
              element={
                <ProtectedRoute>
                  <ShiftListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shifts/:id"
              element={
                <ProtectedRoute>
                  <ShiftDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
