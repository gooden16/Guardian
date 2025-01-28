import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { AuthProvider } from './lib/auth';
import Dashboard from './pages/Dashboard';
import ShiftCalendar from './pages/ShiftCalendar';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Navigation from './components/Navigation';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">CSS Shift Scheduler</h1>
                </div>
                <Navigation />
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/shifts" element={<ShiftCalendar />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
