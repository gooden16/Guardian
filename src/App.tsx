import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Layout from './components/Layout';
import Schedule from './pages/Schedule';
import Volunteers from './pages/Volunteers';
import MyShifts from './pages/MyShifts';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ShiftDetail from './pages/ShiftDetail';
import Login from './pages/Login';
import { testConnection } from './lib/supabase';

function App() {
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testConnection();
      setConnectionError(!isConnected);
      setIsConnecting(false);
    };

    checkConnection();
  }, []);

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <div className="text-gray-600">Connecting to database...</div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">
            Unable to connect to the database. Please try refreshing the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Schedule />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="my-shifts" element={<MyShifts />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="shifts/:id" element={<ShiftDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;