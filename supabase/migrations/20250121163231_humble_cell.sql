/*
  # Fix RLS policies to prevent recursion

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Remove circular dependencies in policy definitions
    - Add basic policies for CRUD operations
  
  2. Security
    - Maintain basic security requirements
    - Allow user profile creation and updates
    - Preserve admin capabilities
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable user profile creation" ON users;
DROP POLICY IF EXISTS "Enable self profile updates" ON users;
DROP POLICY IF EXISTS "Enable admin user deletion" ON users;
DROP POLICY IF EXISTS "Enable user profile creation and updates" ON users;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS sync_user_id_trigger ON users;
DROP FUNCTION IF EXISTS sync_user_id();

-- Create new simplified policies
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to create their own profile
    auth.uid() = id
  );

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can only update their own profile
    auth.uid() = id
  );

CREATE POLICY "users_delete_policy"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    -- Only allow users to delete their own profile
    auth.uid() = id
  );

-- Create admin user if not exists
DO $$ 
DECLARE
  admin_auth_id uuid;
BEGIN
  -- Get the admin's auth.users ID
  SELECT id INTO admin_auth_id
  FROM auth.users
  WHERE email = 'bweiss@gmail.com'
  LIMIT 1;

  -- If admin exists in auth.users but not in public.users, create them
  IF admin_auth_id IS NOT NULL THEN
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
    VALUES (
      admin_auth_id,
      'bweiss@gmail.com',
      'Benjamin',
      'Weiss',
      'ADMIN',
      true,
      0,
      0
    )
    ON CONFLICT (email) DO UPDATE
    SET 
      role = 'ADMIN',
      is_active = true;
  END IF;
END $$;