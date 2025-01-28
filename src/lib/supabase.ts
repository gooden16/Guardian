import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

console.log('Initializing Supabase client...');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL present:', !!supabaseUrl);
console.log('Supabase key present:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'shift-scheduler-auth',
    storage: {
      getItem: (key: string) => {
        const value = window.localStorage.getItem(key);
        console.log('Auth storage get:', { key, value: value ? 'present' : 'missing' });
        return value;
      },
      setItem: (key: string, value: string) => {
        console.log('Auth storage set:', { key, value: value ? 'present' : 'missing' });
        window.localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        console.log('Auth storage remove:', { key });
        window.localStorage.removeItem(key);
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'shift-scheduler'
    }
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, clientOptions);