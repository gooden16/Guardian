/*
  # Fix profiles policies recursion

  1. Changes
    - Create admin check function
    - Recreate policies to avoid recursion
    - Fix UPDATE policy to not use NEW record
    - Add policy for shift volunteers view

  2. Security
    - Maintains same security model but implements it more efficiently
    - Prevents users from escalating privileges
*/

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Initial admin can create profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own non-admin profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access" ON profiles;

-- Recreate policies without recursion
CREATE POLICY "Allow initial profile creation"
  ON profiles
  FOR INSERT
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM profiles) -- Allow if table is empty
    OR is_admin(auth.uid())            -- Or if user is admin
  );

CREATE POLICY "Allow viewing own profile"
  ON profiles
  FOR SELECT
  USING (
    id = auth.uid()                    -- Own profile
    OR is_admin(auth.uid())            -- Or admin
  );

CREATE POLICY "Allow updating own non-admin profile"
  ON profiles
  FOR UPDATE
  USING (
    id = auth.uid()                    -- Own profile
    AND NOT is_admin                   -- Not an admin profile
  )
  WITH CHECK (
    id = auth.uid()                    -- Own profile
    AND is_admin = false               -- Can't make self admin
  );

CREATE POLICY "Allow admin full access"
  ON profiles
  FOR ALL
  USING (is_admin(auth.uid()));

-- Add policies for the view
CREATE POLICY "Allow viewing shift volunteers"
  ON shift_volunteers_with_profiles
  FOR SELECT
  TO authenticated
  USING (true);