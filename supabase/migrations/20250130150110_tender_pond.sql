/*
  # Fix shift volunteers RLS policies
  
  1. Changes
    - Drops and recreates shift volunteers policies with proper checks
    - Adds better validation for shift signup
    - Ensures proper access control
  
  2. Security
    - Maintains max 4 volunteers per shift limit
    - Ensures users can only sign up themselves
    - Allows viewing all shift volunteers
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can sign up for shifts" ON shift_volunteers;
DROP POLICY IF EXISTS "Users can view all shift volunteers" ON shift_volunteers;
DROP POLICY IF EXISTS "Users can remove themselves from shifts" ON shift_volunteers;

-- Create new policies with proper checks
CREATE POLICY "Users can view all shift volunteers"
  ON shift_volunteers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can sign up for shifts"
  ON shift_volunteers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can only sign up themselves
    auth.uid() = user_id
    AND
    -- User must have a profile
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
    AND
    -- Shift must exist and not be full
    EXISTS (
      SELECT 1 FROM shifts
      WHERE shifts.id = shift_id
      AND (
        SELECT COUNT(*)
        FROM shift_volunteers sv
        WHERE sv.shift_id = shift_volunteers.shift_id
      ) < 4
    )
  );

CREATE POLICY "Users can remove themselves from shifts"
  ON shift_volunteers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);