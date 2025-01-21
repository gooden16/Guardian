import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Settings, User } from 'lucide-react';
import Sidebar from './Sidebar';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const navigate = useNavigate();
  const { user, notifications, setUser } = useStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createUserProfile = async (authUser: any) => {
    try {
      // First check if a profile already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (existingUser) {
        // If profile exists but IDs don't match, update the ID
        if (existingUser.id !== authUser.id) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: authUser.id })
            .eq('email', authUser.email);

          if (updateError) throw updateError;
          return { ...existingUser, id: authUser.id };
        }
        return existingUser;
      }

      // Create new profile if none exists
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.id,
            email: authUser.email,
            first_name: authUser.email.split('@')[0],
            last_name: '',
            role: 'L1',
            is_active: true,
            quarterly_required: 3,
            quarterly_completed: 0,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      return newUser;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session?.user) {
        navigate('/login');
        return;
      }

      // Try to get or create user profile
      const finalUserData = await createUserProfile(session.user);

      if (!finalUserData) {
        console.error('Failed to get or create user profile');
        navigate('/login');
        return;
      }

      setUser({
        id: finalUserData.id,
        email: finalUserData.email,
        firstName: finalUserData.first_name,
        lastName: finalUserData.last_name,
        role: finalUserData.role,
        phoneNumber: finalUserData.phone_number || '',
        isActive: finalUserData.is_active,
        profileUrl: finalUserData.profile_url,
        quarterlyCommitment: {
          required: finalUserData.quarterly_required,
          completed: finalUserData.quarterly_completed,
        },
      });
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8" />
            <h1 className="text-xl font-semibold">CSS HIR Volunteer Portal</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/notifications')}
              className="p-2 hover:bg-blue-700 rounded-lg"
            >
              {unreadCount > 0 && (
                <span className="relative">
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                  🔔
                </span>
              )}
            </button>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 hover:bg-blue-700 rounded-lg px-3 py-2"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span>{user?.firstName} {user?.lastName}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8 flex gap-6">
        <Sidebar />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}