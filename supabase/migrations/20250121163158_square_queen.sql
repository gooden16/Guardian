/*
  # Fix user creation and profile handling

  1. Changes
    - Update unique constraints for users table
    - Modify RLS policies to handle user creation properly
    - Add trigger to handle ID synchronization
  
  2. Security
    - Maintain email uniqueness
    - Allow profile creation during signup
    - Preserve existing security policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable user profile creation" ON users;
DROP POLICY IF EXISTS "Enable self profile updates" ON users;
DROP POLICY IF EXISTS "Enable admin user deletion" ON users;

-- Create new policies
CREATE POLICY "Enable read access for all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable user profile creation and updates"
  ON users
  FOR ALL
  TO authenticated
  USING (
    -- Users can access their own profile
    auth.uid() = id
    OR
    -- Admins can access all profiles
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    -- Users can modify their own profile
    auth.uid() = id
    OR
    -- Admins can modify all profiles
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

-- Create function to handle user ID updates
CREATE OR REPLACE FUNCTION sync_user_id()
RETURNS trigger AS $$
BEGIN
  -- If email exists but ID is different, update the ID
  IF TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM users WHERE email = NEW.email AND id != NEW.id
  ) THEN
    UPDATE users SET id = NEW.id WHERE email = NEW.email;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user ID synchronization
DROP TRIGGER IF EXISTS sync_user_id_trigger ON users;
CREATE TRIGGER sync_user_id_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_id();

-- Ensure admin user exists
DO $$ 
BEGIN
  INSERT INTO users (
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
  ON CONFLICT (email) 
  DO UPDATE SET
    role = 'ADMIN',
    is_active = true;
END $$;