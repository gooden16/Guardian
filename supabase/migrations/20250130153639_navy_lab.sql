/*
  # Fix role change requests relationship

  1. Changes
    - Add proper foreign key relationship between role_change_requests and profiles
    - Update role change requests query to use proper join syntax
    - Add index for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing foreign key if it exists
ALTER TABLE role_change_requests
  DROP CONSTRAINT IF EXISTS role_change_requests_user_id_fkey;

-- Add proper foreign key relationship
ALTER TABLE role_change_requests
  ADD CONSTRAINT role_change_requests_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_role_change_requests_user_id
  ON role_change_requests(user_id);

-- Update role change requests policies to use proper joins
DROP POLICY IF EXISTS "Users can view their own requests" ON role_change_requests;
DROP POLICY IF EXISTS "Users can create requests" ON role_change_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON role_change_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON role_change_requests;

-- Recreate policies with proper joins
CREATE POLICY "Users can view their own requests"
  ON role_change_requests
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = role_change_requests.user_id
    )
  );

CREATE POLICY "Users can create requests"
  ON role_change_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = role_change_requests.user_id
    )
    AND status = 'pending'
  );

CREATE POLICY "Admins can view all requests"
  ON role_change_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update requests"
  ON role_change_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );