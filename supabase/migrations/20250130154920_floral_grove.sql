/*
  # Team Leader Shift Rules

  1. Changes
    - Delete all existing shift assignments
    - Add validation to ensure Team Leaders sign up for both shifts on a day
    - Update shift volunteer constraints

  2. Security
    - Maintain existing RLS policies
    - Add database-level validation for TL shift rules
*/

-- Delete all existing shift assignments
DELETE FROM shift_volunteers;

-- Create function to validate TL shift signup
CREATE OR REPLACE FUNCTION validate_tl_shift_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_role volunteer_role;
  shift_date date;
  shift_type shift_type;
  other_shift_type shift_type;
  other_shift_id uuid;
  other_shift_signup boolean;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = NEW.user_id;

  -- If not a Team Leader, allow signup
  IF user_role != 'TL' THEN
    RETURN NEW;
  END IF;

  -- Get shift date and type
  SELECT date, type INTO shift_date, shift_type
  FROM shifts
  WHERE id = NEW.shift_id;

  -- Determine the other shift type
  other_shift_type := CASE 
    WHEN shift_type = 'early' THEN 'late'
    ELSE 'early'
  END;

  -- Get the other shift's ID for the same date
  SELECT id INTO other_shift_id
  FROM shifts
  WHERE date = shift_date
  AND type = other_shift_type;

  -- Check if already signed up for other shift
  SELECT EXISTS (
    SELECT 1 FROM shift_volunteers
    WHERE shift_id = other_shift_id
    AND user_id = NEW.user_id
  ) INTO other_shift_signup;

  -- For Team Leaders, ensure they're signing up for both shifts
  IF NOT other_shift_signup THEN
    RAISE EXCEPTION 'Team Leaders must sign up for both shifts on the same day';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for TL shift signup validation
DROP TRIGGER IF EXISTS validate_tl_shift_signup_trigger ON shift_volunteers;
CREATE TRIGGER validate_tl_shift_signup_trigger
  BEFORE INSERT ON shift_volunteers
  FOR EACH ROW
  EXECUTE FUNCTION validate_tl_shift_signup();