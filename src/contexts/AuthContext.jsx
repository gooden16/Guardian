import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';
import { AuthError, ErrorCodes, getErrorMessage } from '../utils/errors';

// Create context
const AuthContext = createContext(null);

// Export useAuthContext hook
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Export AuthProvider
export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    profile: null,
    loading: true,
    initialized: false
  });

  const handleAuthError = useCallback((error, code = ErrorCodes.AUTH_UNKNOWN_ERROR) => {
    const authError = new AuthError(getErrorMessage(code), code, error);
    logger.error('Authentication error', authError, {
      code,
      originalError: error
    });
    
    toast.error(getErrorMessage(code));
    
    setState(prev => ({
      ...prev,
      loading: false,
      initialized: true
    }));
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
        initialized: true
      });
      
      logger.info('User signed out successfully');
      toast.success('Signed out successfully');
    } catch (error) {
      handleAuthError(error);
    }
  }, [state.user?.id, handleAuthError]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        logger.info('Initializing authentication');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw new AuthError(
            'Failed to get session',
            ErrorCodes.SESSION_INVALID,
            error
          );
        }

        if (session?.user && mounted) {
          logger.debug('Session found, fetching profile', { userId: session.user.id });
          
          // Fetch profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            throw new AuthError(
              'Failed to fetch profile',
              ErrorCodes.PROFILE_NOT_FOUND,
              profileError
            );
          }

          if (mounted) {
            setState({
              user: session.user,
              profile,
              loading: false,
              initialized: true
            });
          }
        } else if (mounted) {
          logger.debug('No active session found');
          
          setState({
            user: null,
            profile: null,
            loading: false,
            initialized: true
          });
        }
      } catch (error) {
        handleAuthError(error);
      }
    }

    initialize();

    // Set up auth state change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        logger.info('Auth state changed', { event });

        try {
          if (session?.user) {
            setState(prev => ({ ...prev, loading: true }));

            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileError) {
              throw new AuthError(
                'Failed to fetch profile',
                ErrorCodes.PROFILE_NOT_FOUND,
                profileError
              );
            }

            if (mounted) {
              logger.info('Auth state updated successfully', {
                userId: session.user.id,
                event
              });
              
              setState({
                user: session.user,
                profile,
                loading: false,
                initialized: true
              });
            }
          } else if (mounted) {
            logger.info('User signed out', { event });
            
            setState({
              user: null,
              profile: null,
              loading: false,
              initialized: true
            });
          }
        } catch (error) {
          handleAuthError(error);
        }
      }
    );

    return () => {
      logger.debug('Cleaning up auth subscriptions');
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [handleAuthError]);

  // Don't render anything until we've initialized
  if (!state.initialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}