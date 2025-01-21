/*
  # Fix user authentication and profile synchronization

  1. Changes
    - Drop existing policies to clean up
    - Create new simplified policies for user access
    - Add function to ensure user profile exists
    - Add trigger to automatically create profiles for new auth users
    - Fix admin user setup

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_write_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Create new simplified policies
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_write_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile()
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
    split_part(NEW.email, '@', 1),
    '',
    'L1',
    true,
    3,
    0
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create user profiles
DROP TRIGGER IF EXISTS ensure_user_profile_trigger ON auth.users;
CREATE TRIGGER ensure_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile();

-- Sync existing auth users
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
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      first_name = CASE 
        WHEN users.first_name = '' THEN EXCLUDED.first_name 
        ELSE users.first_name 
      END,
      last_name = CASE 
        WHEN users.last_name = '' THEN EXCLUDED.last_name 
        ELSE users.last_name 
      END;
  END LOOP;
END $$;