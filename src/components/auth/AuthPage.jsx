import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';

export function AuthPage() {
  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CSS Guardian</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">HIR Chapter</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          redirectTo="http://localhost:5173/"
        />
      </div>
    </div>
  );
}
