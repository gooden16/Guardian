import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';

// Ensure the root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Create root and render app
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
