/*
  # Fix shift assignments RLS policies with proper error handling

  1. Changes
    - Simplify RLS policies
    - Add better error handling
    - Fix permission issues
  
  2. Security
    - Maintain RLS on shift_assignments table
    - Ensure proper role-based access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Users can create their own assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON shift_assignments;

-- Drop existing functions
DROP FUNCTION IF EXISTS check_role_quota(uuid, uuid);
DROP FUNCTION IF EXISTS debug_role_quota(uuid, uuid);

-- Create simplified role quota check function
CREATE OR REPLACE FUNCTION check_role_quota(
  shift_id uuid,
  user_id uuid
) RETURNS boolean AS $$
DECLARE
  user_role role_type;
  shift_record record;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;

  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User role not found';
  END IF;

  -- Get shift details
  SELECT * INTO shift_record
  FROM shifts
  WHERE id = shift_id;

  IF shift_record IS NULL THEN
    RAISE EXCEPTION 'Shift not found';
  END IF;

  -- Check role-specific quotas
  CASE user_role
    WHEN 'TL' THEN
      IF shift_record.filled_tl >= shift_record.required_tl THEN
        RETURN false;
      END IF;
    WHEN 'L1' THEN
      IF shift_record.filled_l1 >= shift_record.required_l1 THEN
        RETURN false;
      END IF;
    WHEN 'L2' THEN
      IF shift_record.filled_l2 >= shift_record.required_l2 THEN
        RETURN false;
      END IF;
  END CASE;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies with simplified checks
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
    AND NOT EXISTS (
      SELECT 1 
      FROM shift_assignments 
      WHERE shift_id = NEW.shift_id 
      AND user_id = NEW.user_id 
      AND withdrawal_reason IS NULL
    )
    AND check_role_quota(NEW.shift_id, auth.uid())
  );

CREATE POLICY "Users can delete their own assignments"
  ON shift_assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;