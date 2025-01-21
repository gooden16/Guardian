/*
  # Update RLS policies for user creation

  1. Changes
    - Add policy to allow authenticated users to create their own profile
    - Simplify existing policies for better security
    - Fix user creation during signup
  
  2. Security
    - Maintain RLS protection
    - Allow users to create their own profile only
    - Preserve admin capabilities
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON users;
DROP POLICY IF EXISTS "Allow admins to insert users" ON users;
DROP POLICY IF EXISTS "Allow admins to delete users" ON users;

-- Create new policies
CREATE POLICY "Enable read access for all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable user profile creation"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to create their own profile
    auth.uid() = id
    OR 
    -- Allow admins to create profiles
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Enable self profile updates"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own profile
    auth.uid() = id
    OR
    -- Admins can update any profile
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    -- Users can update their own profile
    auth.uid() = id
    OR
    -- Admins can update any profile
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Enable admin user deletion"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

-- Ensure admin user exists
DO $$ 
DECLARE
  admin_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE email = 'bweiss@gmail.com'
  ) INTO admin_exists;

  IF NOT admin_exists THEN
    -- Get admin auth user if exists
    WITH admin_auth AS (
      SELECT id 
      FROM auth.users 
      WHERE email = 'bweiss@gmail.com'
      LIMIT 1
    )
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
    FROM admin_auth
    ON CONFLICT (email) DO UPDATE
    SET 
      role = 'ADMIN',
      is_active = true;
  END IF;
END $$;