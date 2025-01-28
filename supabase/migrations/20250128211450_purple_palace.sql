/*
  # Update shift management policies

  1. Changes
    - Add complete CRUD policies for administrators
    - Ensure policies cover all operations (SELECT, INSERT, UPDATE, DELETE)
    - Keep existing policy for viewing shifts

  2. Security
    - Administrators have full control over shifts
    - All authenticated users can view shifts
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Administrators can manage shifts" ON shifts;
DROP POLICY IF EXISTS "Anyone can view shifts" ON shifts;

-- Create comprehensive admin policies for all operations
CREATE POLICY "Administrators can view shifts"
  ON shifts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM volunteers
      WHERE auth_user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Administrators can insert shifts"
  ON shifts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM volunteers
      WHERE auth_user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Administrators can update shifts"
  ON shifts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM volunteers
      WHERE auth_user_id = auth.uid()
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM volunteers
      WHERE auth_user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Administrators can delete shifts"
  ON shifts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM volunteers
      WHERE auth_user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Create policy for all authenticated users to view shifts
CREATE POLICY "Authenticated users can view shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (true);