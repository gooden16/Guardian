-- First, clean up existing policies and triggers
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

-- Create new function for handling user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'L1'),
    true,
    3,
    0
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    id = EXCLUDED.id,
    first_name = CASE 
      WHEN users.first_name = '' OR users.first_name IS NULL 
      THEN EXCLUDED.first_name 
      ELSE users.first_name 
    END,
    last_name = CASE 
      WHEN users.last_name = '' OR users.last_name IS NULL 
      THEN EXCLUDED.last_name 
      ELSE users.last_name 
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create new policies with simplified permissions
CREATE POLICY "allow_select"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR role = 'ADMIN');

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Sync existing auth users with public users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN
    SELECT * FROM auth.users
  LOOP
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
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(
        (auth_user.raw_user_meta_data->>'first_name'),
        split_part(auth_user.email, '@', 1)
      ),
      COALESCE(
        (auth_user.raw_user_meta_data->>'last_name'),
        ''
      ),
      COALESCE(
        (auth_user.raw_user_meta_data->>'role'),
        'L1'
      ),
      true,
      3,
      0
    )
    ON CONFLICT (email) DO UPDATE
    SET 
      id = EXCLUDED.id,
      role = CASE 
        WHEN users.email = 'bweiss@gmail.com' THEN 'ADMIN'
        ELSE users.role
      END,
      is_active = true;
  END LOOP;
END $$;