import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield } from 'lucide-react';

export function CompleteProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastNameInitial: '',
    phone: '',
    rank: 'L1' as 'L1' | 'L2' | 'TL'
  });

  useEffect(() => {
    const getOAuthData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const metadata = user.user_metadata;
      setFormData(prev => ({
        ...prev,
        firstName: metadata?.given_name || '',
        lastNameInitial: (metadata?.family_name || '').charAt(0) || '',
      }));
    };
    getOAuthData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastNameInitial,
        phone: formData.phone,
        role: formData.rank,
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url
      });

      if (error) throw error;
      navigate('/shifts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Shield className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="First Name"
              />
            </div>
            <div>
              <input
                type="text"
                required
                maxLength={1}
                value={formData.lastNameInitial}
                onChange={e => setFormData(prev => ({ ...prev, lastNameInitial: e.target.value.charAt(0) }))}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Last Name Initial"
              />
            </div>
            <div>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Phone Number"
              />
            </div>
            <div>
              <select
                required
                value={formData.rank}
                onChange={e => setFormData(prev => ({ ...prev, rank: e.target.value as 'L1' | 'L2' | 'TL' }))}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              >
                <option value="L1">Level 1 Volunteer</option>
                <option value="L2">Level 2 Volunteer</option>
                <option value="TL">Team Leader</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Completing Profile...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
