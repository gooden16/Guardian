-- Drop all existing policies and triggers
DROP POLICY IF EXISTS "allow_read" ON users;
DROP POLICY IF EXISTS "allow_insert" ON users;
DROP POLICY IF EXISTS "allow_update" ON users;
DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;
DROP FUNCTION IF EXISTS handle_auth_user_change();

-- Create simplified policies
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_policy"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Create a more reliable trigger function
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger AS $$
DECLARE
  default_role text := 'L1';
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
    default_role,
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();

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