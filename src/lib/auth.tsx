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
      console.log('Initial session:', session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchVolunteer(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(error => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchVolunteer(session.user.id);
      } else {
        setVolunteer(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchVolunteer(userId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found during volunteer fetch');
        setVolunteer(null);
        return;
      }
      
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching volunteer:', error);
        setVolunteer(null);
      } else {
        console.log('Volunteer data:', data);
        setVolunteer(data);
      }
    } catch (error) {
      console.error('Error in fetchVolunteer:', error);
      setVolunteer(null);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, firstName: string, lastInitial: string) {
    try {
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

        if (volunteerError) {
          console.error('Error creating volunteer:', volunteerError);
          throw volunteerError;
        }
      }
    } catch (error) {
      console.error('Error in signUp:', error);
      throw error;
    }
  }

  async function signIn(email: string, password: string) {
    try {
      // Clear any existing session first
      console.log('Clearing existing session...');
      await supabase.auth.signOut();
      
      console.log('Attempting sign in with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        throw error;
      }

      console.log('Sign in response:', {
        user: data.user?.id,
        session: data.session?.access_token ? 'Present' : 'Missing'
      });

      // Verify session was created
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session after sign in:', {
        exists: !!session,
        userId: session?.user?.id
      });

    } catch (error) {
      console.error('Error in signIn:', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      // Clear session from storage first
      window.sessionStorage.removeItem('supabase.auth.token');
      window.localStorage.removeItem('supabase.auth.token');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setVolunteer(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
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