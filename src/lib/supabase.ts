import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = 'https://rwseebtsdokwdogbvswk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3c2VlYnRzZG9rd2RvZ2J2c3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MjUwMzAsImV4cCI6MjA1MzUwMTAzMH0.sL1Z0KAAWCh_uVB2bCSzYPh8fwgnqTmi9YGjCvrr584';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);