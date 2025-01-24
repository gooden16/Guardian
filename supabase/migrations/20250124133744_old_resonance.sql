/*
  # Fix shift assignments RLS policies with debugging

  1. Changes
    - Add debugging function
    - Update role quota check function
    - Recreate policies with proper error handling
  
  2. Security
    - Maintain RLS on shift_assignments table
    - Ensure proper role-based access control
*/

-- Create debugging function
CREATE OR REPLACE FUNCTION debug_role_quota(
  shift_id uuid,
  user_id uuid
) RETURNS text AS $$
DECLARE
  user_role role_type;
  current_filled int;
  required_slots int;
  shift_type text;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;

  -- Get shift details
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
    END,
    s.shift_type
  INTO current_filled, required_slots, shift_type
  FROM shifts s
  WHERE s.id = shift_id;

  RETURN format(
    'User role: %s, Shift type: %s, Current filled: %s, Required slots: %s',
    user_role,
    shift_type,
    current_filled,
    required_slots
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update role quota check function
CREATE OR REPLACE FUNCTION check_role_quota(
  shift_id uuid,
  user_id uuid
) RETURNS boolean AS $$
DECLARE
  user_role role_type;
  current_filled int;
  required_slots int;
  shift_type text;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;

  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User role not found';
  END IF;

  -- Get shift details
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
    END,
    s.shift_type
  INTO current_filled, required_slots, shift_type
  FROM shifts s
  WHERE s.id = shift_id;

  IF current_filled IS NULL OR required_slots IS NULL THEN
    RAISE EXCEPTION 'Shift not found or invalid role configuration';
  END IF;

  -- For TLs, handle Early/Late shifts together
  IF user_role = 'TL' AND shift_type IN ('Early', 'Late') THEN
    -- Find the other shift for the same date
    DECLARE
      other_shift_id uuid;
      other_filled int;
    BEGIN
      SELECT s2.id, s2.filled_tl INTO other_shift_id, other_filled
      FROM shifts s1
      JOIN shifts s2 ON s1.date = s2.date 
        AND s2.id != s1.id 
        AND s2.shift_type IN ('Early', 'Late')
      WHERE s1.id = shift_id;

      IF other_shift_id IS NOT NULL THEN
        -- Check both shifts have space
        RETURN current_filled < required_slots AND other_filled < required_slots;
      END IF;
    END;
  END IF;

  RETURN current_filled < required_slots;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Users can create their own assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON shift_assignments;

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
    AND check_role_quota(shift_id, auth.uid())
  );

CREATE POLICY "Users can delete their own assignments"
  ON shift_assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_role_quota TO authenticated;
GRANT EXECUTE ON FUNCTION debug_role_quota TO authenticated;