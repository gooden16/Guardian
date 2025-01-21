-- Drop all existing policies
DROP POLICY IF EXISTS "allow_read" ON users;
DROP POLICY IF EXISTS "allow_write" ON users;
DROP POLICY IF EXISTS "allow_update" ON users;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_change() CASCADE;

-- Create simplified policies
CREATE POLICY "allow_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "allow_update"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Create a more reliable trigger function
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
    'L1',
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

-- Create new trigger
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- Ensure admin user exists
DO $$
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
    '00000000-0000-0000-0000-000000000000',
    'bweiss@gmail.com',
    'Benjamin',
    'Weiss',
    'ADMIN',
    true,
    0,
    0
  )
  ON CONFLICT (email) DO UPDATE
  SET role = 'ADMIN', is_active = true;
END $$;