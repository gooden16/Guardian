/*
  # Fix Team Leader shift signup logic

  1. Changes
    - Drop existing TL validation trigger
    - Create new function for handling TL signups in a single transaction
    - Update RLS policies to work with new approach

  2. Security
    - Maintain RLS policies
    - Add proper validation checks
*/

-- Drop the existing TL validation trigger
DROP TRIGGER IF EXISTS validate_tl_shift_signup_trigger ON shift_volunteers;
DROP FUNCTION IF EXISTS validate_tl_shift_signup();

-- Create new function to handle Team Leader signups
CREATE OR REPLACE FUNCTION handle_team_leader_signup(
  shift_id_1 UUID,
  shift_id_2 UUID
)
RETURNS void AS $$
DECLARE
  user_role volunteer_role;
  shift_1_date date;
  shift_2_date date;
  shift_1_type shift_type;
  shift_2_type shift_type;
  shift_1_count integer;
  shift_2_count integer;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  IF user_role != 'TL' THEN
    RAISE EXCEPTION 'Only Team Leaders can use this function';
  END IF;

  -- Get shift details
  SELECT date, type INTO shift_1_date, shift_1_type
  FROM shifts
  WHERE id = shift_id_1;

  SELECT date, type INTO shift_2_date, shift_2_type
  FROM shifts
  WHERE id = shift_id_2;

  -- Validate shifts
  IF shift_1_date != shift_2_date THEN
    RAISE EXCEPTION 'Shifts must be on the same day';
  END IF;

  IF shift_1_type = shift_2_type THEN
    RAISE EXCEPTION 'Must select one early and one late shift';
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

  -- Check if already signed up for either shift
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

-- Update RLS policies for shift_volunteers
DROP POLICY IF EXISTS "Users can sign up for shifts" ON shift_volunteers;

CREATE POLICY "Users can sign up for shifts"
  ON shift_volunteers
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        -- Regular volunteers can sign up normally
        role != 'TL'
        OR
        -- Team Leaders must use the special function
        role = 'TL' AND EXISTS (
          SELECT 1 FROM shift_volunteers sv2
          WHERE sv2.user_id = auth.uid()
          AND sv2.shift_id != shift_volunteers.shift_id
          AND EXISTS (
            SELECT 1 FROM shifts s1, shifts s2
            WHERE s1.id = shift_volunteers.shift_id
            AND s2.id = sv2.shift_id
            AND s1.date = s2.date
            AND s1.type != s2.type
          )
        )
      )
    )
    AND (
      -- Check if shift is not full
      SELECT COUNT(*) < 4
      FROM shift_volunteers sv
      WHERE sv.shift_id = shift_volunteers.shift_id
    )
  );