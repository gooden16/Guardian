import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield } from 'lucide-react';

/**
 * Handles the OAuth redirect from Supabase after Google/Apple sign-in.
 * Supabase automatically exchanges the code for a session; we just wait
 * for the auth state to settle then redirect appropriately.
 */
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase's detectSessionInUrl handles the token exchange automatically
    // when the client is initialised. We just need to wait for the session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Check if onboarding is complete
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!profile || profile.onboarding_complete === false) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/schedule', { replace: true });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Shield className="h-12 w-12 text-indigo-600" />
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <p className="text-sm text-gray-500">Signing you in…</p>
    </div>
  );
}
