import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  function parseError(err: unknown): string {
    console.error('Auth error:', err);
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null) {
      const errorObj = err as { message?: string };
      if (errorObj.message?.includes('over_email_send_rate_limit')) {
        setCooldown(true);
        setTimeout(() => setCooldown(false), 30000);
        return 'Please wait 30 seconds before trying again';
      }
      return errorObj.message || 'An error occurred';
    }
    return 'An error occurred';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (cooldown) {
      setError('Please wait before trying again');
      return;
    }
    
    setLoading(true);
    setDebugInfo('');

    try {
      setDebugInfo('Starting authentication...');
      if (isSignUp) {
        setDebugInfo('Attempting sign up...');
        await signUp(email, password, firstName, lastInitial);
      } else {
        setDebugInfo('Attempting sign in...');
        await signIn(email, password);
      }
      setDebugInfo('Authentication successful!');
      onClose();
    } catch (err) {
      setDebugInfo(`Auth failed: ${JSON.stringify(err)}`);
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastInitial" className="block text-sm font-medium text-gray-700">
                  Last Initial
                </label>
                <input
                  type="text"
                  id="lastInitial"
                  value={lastInitial}
                  onChange={(e) => setLastInitial(e.target.value)}
                  maxLength={1}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
            </>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || cooldown}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 mb-4"
          >
            {loading ? 'Loading...' : cooldown ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
          
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}

          <div className="text-sm text-center">
            {isSignUp ? (
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-blue-600 hover:text-blue-500"
              >
                Already have an account? Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="text-blue-600 hover:text-blue-500"
              >
                Need an account? Sign up
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}