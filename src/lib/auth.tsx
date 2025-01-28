import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from './database.types';

type Volunteer = Database['public']['Tables']['volunteers']['Row'];

interface AuthContextType {
  user: User | null;
  volunteer: Volunteer | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastInitial: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchVolunteer(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchVolunteer(session.user.id);
      } else {
        setVolunteer(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchVolunteer(userId: string) {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('auth_user_id', userId);

    if (error) {
      console.error('Error fetching volunteer:', error);
      setVolunteer(null);
      setLoading(false);
      return;
    }
    
    // Handle case where volunteer might not exist yet
    setVolunteer(data && data.length > 0 ? data[0] : null);
    setLoading(false);
  }

  async function signUp(email: string, password: string, firstName: string, lastInitial: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      const { data: existingVolunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (existingVolunteer) {
        return; // Volunteer already exists
      }

      const { error: volunteerError } = await supabase
        .from('volunteers')
        .insert({
          auth_user_id: authData.user.id,
          email,
          first_name: firstName,
          last_initial: lastInitial,
          role: 'L1',
          phone: '', // Required by schema but can be updated later
          is_admin: false,
        });

      if (volunteerError) throw volunteerError;
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value = {
    user,
    volunteer,
    signIn,
    signUp,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}