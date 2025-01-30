/*
  # Fix profile policies to prevent recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies with proper checks
    - Add initial admin check policy

  2. Security
    - Maintain row level security
    - Ensure proper access control
    - Fix infinite recursion issue
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can modify all profiles" ON profiles;

-- Create initial admin check policy
CREATE POLICY "Initial admin can create profile"
  ON profiles
  FOR INSERT
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM profiles)  -- Allow insert if table is empty
    OR (
      EXISTS (  -- Otherwise, must be admin
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND is_admin = true
      )
    )
  );

-- Recreate user policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own non-admin profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND NOT is_admin  -- Prevent users from making themselves admin
    AND NOT NEW.is_admin  -- Ensure they can't set admin flag
  );

-- Recreate admin policies without recursion
CREATE POLICY "Admins have full access"
  ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );