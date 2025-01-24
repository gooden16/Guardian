/*
  # Fix shift assignments RLS policies

  1. Changes
    - Drop existing policies for shift_assignments
    - Create new policies with proper role checks and quota validation
    - Add function to validate role quotas
  
  2. Security
    - Enable RLS on shift_assignments table
    - Add policies for:
      - Reading assignments
      - Creating assignments with role quota checks
      - Deleting own assignments
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Users can create their own assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON shift_assignments;

-- Create function to check role quotas
CREATE OR REPLACE FUNCTION check_role_quota(
  shift_id uuid,
  user_role role_type
) RETURNS boolean AS $$
DECLARE
  current_filled int;
  required_slots int;
BEGIN
  -- Get current filled slots for the role
  SELECT 
    CASE 
      WHEN user_role = 'TL' THEN filled_tl
      WHEN user_role = 'L1' THEN filled_l1
      WHEN user_role = 'L2' THEN filled_l2
    END,
    CASE 
      WHEN user_role = 'TL' THEN required_tl
      WHEN user_role = 'L1' THEN required_l1
      WHEN user_role = 'L2' THEN required_l2
    END
  INTO current_filled, required_slots
  FROM shifts
  WHERE id = shift_id;

  RETURN current_filled < required_slots;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies
CREATE POLICY "Users can read their assignments"
  ON shift_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assignments"
  ON shift_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      SELECT check_role_quota(
        shift_id,
        (SELECT role FROM profiles WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete their own assignments"
  ON shift_assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);