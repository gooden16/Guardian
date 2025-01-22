import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';
import { AuthError, ErrorCodes, getErrorMessage } from '../utils/errors';

const AuthContext = createContext(null);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    error: null
  });

  const handleAuthError = useCallback((error, code = ErrorCodes.AUTH_UNKNOWN_ERROR) => {
    const authError = new AuthError(getErrorMessage(code), code, error);
    logger.error('Authentication error', authError, {
      code,
      originalError: error
    });
    
    setState(prev => ({
      ...prev,
      loading: false,
      initialized: true,
      error: authError
    }));
  }, []);

  const loadProfile = useCallback(async (userId) => {
    try {
      logger.debug('Loading profile', { userId });
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new AuthError(
          'Failed to fetch profile',
          ErrorCodes.PROFILE_NOT_FOUND,
          profileError
        );
      }

      return profile;
    } catch (error) {
      logger.error('Error loading profile', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      logger.info('Signing out user', { userId: state.user?.id });
      
      setState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
        error: null
      });
      
      logger.info('User signed out successfully');
      toast.success('Signed out successfully');
    } catch (error) {
      handleAuthError(error);
    }
  }, [state.user?.id, handleAuthError]);

  useEffect(() => {
    let mounted = true;
    let initTimeout;

    async function initialize() {
      try {
        logger.info('Initializing authentication');
        
        // Set a timeout to prevent infinite loading
        initTimeout = setTimeout(() => {
          if (mounted && state.loading) {
            setState(prev => ({
              ...prev,
              loading: false,
              initialized: true,
              error: new Error('Authentication initialization timed out')
            }));
          }
        }, 5000);

        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new AuthError(
            'Failed to get session',
            ErrorCodes.SESSION_INVALID,
            sessionError
          );
        }

        if (!mounted) return;

        if (!session?.user) {
          logger.debug('No active session found');
          setState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
            error: null
          });
          return;
        }

        logger.debug('Session found, loading profile', { userId: session.user.id });
        
        // Load profile
        const profile = await loadProfile(session.user.id);

        if (!mounted) return;

        setState({
          user: session.user,
          profile,
          loading: false,
          initialized: true,
          error: null
        });
        
        logger.debug('Auth initialized with user', { userId: session.user.id });

      } catch (error) {
        if (mounted) {
          handleAuthError(error);
        }
      } finally {
        if (initTimeout) {
          clearTimeout(initTimeout);
        }
      }
    }

    initialize();

    // Set up auth state change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        logger.info('Auth state changed', { event });

        try {
          if (!session?.user) {
            logger.info('User signed out', { event });
            setState({
              user: null,
              profile: null,
              loading: false,
              initialized: true,
              error: null
            });
            return;
          }

          setState(prev => ({ ...prev, loading: true }));

          // Load profile
          const profile = await loadProfile(session.user.id);

          if (!mounted) return;

          logger.info('Auth state updated successfully', {
            userId: session.user.id,
            event
          });
          
          setState({
            user: session.user,
            profile,
            loading: false,
            initialized: true,
            error: null
          });
        } catch (error) {
          if (mounted) {
            handleAuthError(error);
          }
        }
      }
    );

    return () => {
      logger.debug('Cleaning up auth subscriptions');
      mounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      subscription?.unsubscribe();
    };
  }, [handleAuthError, loadProfile]);

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}