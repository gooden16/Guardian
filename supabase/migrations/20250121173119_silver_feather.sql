-- Clean up existing policies and triggers
DO $$ 
BEGIN
  -- Drop all policies from users table
  DROP POLICY IF EXISTS "users_read_policy" ON users;
  DROP POLICY IF EXISTS "users_insert_policy" ON users;
  DROP POLICY IF EXISTS "users_update_policy" ON users;
  DROP POLICY IF EXISTS "users_delete_policy" ON users;
  DROP POLICY IF EXISTS "allow_read" ON users;
  DROP POLICY IF EXISTS "allow_insert" ON users;
  DROP POLICY IF EXISTS "allow_update" ON users;
  DROP POLICY IF EXISTS "allow_write" ON users;
  DROP POLICY IF EXISTS "allow_select" ON users;
  
  -- Drop existing triggers
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;
  DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
  
  -- Drop existing functions
  DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
  DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
  DROP FUNCTION IF EXISTS public.handle_auth_user_change() CASCADE;
  DROP FUNCTION IF EXISTS public.sync_user_ids() CASCADE;
END $$;

-- Create simplified policies
CREATE POLICY "enable_read_access"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "enable_insert_access"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "enable_update_access"
  ON users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- Ensure admin user exists
DO $$
DECLARE
  admin_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'bweiss@gmail.com'
  ) INTO admin_exists;

  IF NOT admin_exists THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'bweiss@gmail.com',
      crypt('AdminPass123!', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "ADMIN"}',
      now(),
      now()
    );
  END IF;

  -- Ensure admin profile exists
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    quarterly_required,
    quarterly_completed
  )
  SELECT
    id,
    'bweiss@gmail.com',
    'Benjamin',
    'Weiss',
    'ADMIN',
    true,
    0,
    0
  FROM auth.users
  WHERE email = 'bweiss@gmail.com'
  ON CONFLICT (email) DO UPDATE
  SET 
    role = 'ADMIN',
    is_active = true;
END $$;