-- Add admin role to volunteers table
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create policy for admins to manage shifts
CREATE POLICY "Administrators can manage shifts"
  ON shifts
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

-- Update the existing view policy to be more explicit
DROP POLICY IF EXISTS "Anyone can view shifts" ON shifts;
CREATE POLICY "Anyone can view shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (true);