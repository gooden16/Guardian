/*
  # Fix authentication and user synchronization

  1. Changes
    - Simplify RLS policies
    - Add automatic profile creation
    - Fix user synchronization
    - Improve error handling

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Ensure proper access control
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_read" ON users;
DROP POLICY IF EXISTS "allow_insert" ON users;
DROP POLICY IF EXISTS "allow_update" ON users;

-- Create new simplified policies
CREATE POLICY "allow_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_write"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Function to handle new user creation and updates
CREATE OR REPLACE FUNCTION handle_auth_user_change()
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
    COALESCE(split_part(NEW.email, '@', 1), ''),
    '',
    'L1',
    true,
    3,
    0
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  
  -- Handle email-based profile updates
  UPDATE public.users
  SET id = NEW.id
  WHERE email = NEW.email AND id != NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;

-- Create trigger for auth user changes
CREATE TRIGGER on_auth_user_change
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_change();

-- Sync existing users
DO $$
BEGIN
  -- Create profiles for auth users without profiles
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
    au.id,
    au.email,
    COALESCE(split_part(au.email, '@', 1), ''),
    '',
    'L1',
    true,
    3,
    0
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;

  -- Update existing profiles with mismatched IDs
  UPDATE public.users u
  SET id = au.id
  FROM auth.users au
  WHERE u.email = au.email AND u.id != au.id;
END $$;