/*
  # Fix Team Leader shift signup validation

  1. Changes
    - Add function to validate and insert Team Leader shift signups atomically
    - Ensure both shifts exist and have space before inserting
    - Handle all validations in a single transaction

  2. Security
    - Function is security definer to ensure consistent access
    - Validates user role and permissions
*/

-- Function to handle Team Leader shift signups
CREATE OR REPLACE FUNCTION handle_team_leader_signup(
  shift_id_1 UUID,
  shift_id_2 UUID
)
RETURNS void AS $$
DECLARE
  user_role volunteer_role;
  shift_1_date date;
  shift_2_date date;
  shift_1_count integer;
  shift_2_count integer;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  IF user_role != 'TL' THEN
    RAISE EXCEPTION 'Only Team Leaders can sign up for both shifts';
  END IF;

  -- Get shift dates
  SELECT date INTO shift_1_date
  FROM shifts
  WHERE id = shift_id_1;

  SELECT date INTO shift_2_date
  FROM shifts
  WHERE id = shift_id_2;

  IF shift_1_date != shift_2_date THEN
    RAISE EXCEPTION 'Shifts must be on the same day';
  END IF;

  -- Check if shifts are full
  SELECT COUNT(*) INTO shift_1_count
  FROM shift_volunteers
  WHERE shift_id = shift_id_1;

  SELECT COUNT(*) INTO shift_2_count
  FROM shift_volunteers
  WHERE shift_id = shift_id_2;

  IF shift_1_count >= 4 OR shift_2_count >= 4 THEN
    RAISE EXCEPTION 'One or both shifts are full';
  END IF;

  -- Check if already signed up
  IF EXISTS (
    SELECT 1 FROM shift_volunteers
    WHERE user_id = auth.uid()
    AND (shift_id = shift_id_1 OR shift_id = shift_id_2)
  ) THEN
    RAISE EXCEPTION 'Already signed up for one or both shifts';
  END IF;

  -- Insert both shift signups in a single transaction
  INSERT INTO shift_volunteers (shift_id, user_id)
  VALUES 
    (shift_id_1, auth.uid()),
    (shift_id_2, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;