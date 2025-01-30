/*
  # Fix shift volunteers RLS policies
  
  1. Changes
    - Simplifies shift volunteer policies
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

-- Create simplified policies
CREATE POLICY "Anyone can view shift volunteers"
  ON shift_volunteers
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own shift signups"
  ON shift_volunteers
  USING (auth.uid() = user_id);

-- Create function to validate shift signup
CREATE OR REPLACE FUNCTION validate_shift_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has a profile
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'User must have a profile to sign up for shifts';
  END IF;

  -- Check if shift exists and is not full
  IF NOT EXISTS (
    SELECT 1 FROM shifts
    WHERE id = NEW.shift_id
  ) THEN
    RAISE EXCEPTION 'Shift does not exist';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM shift_volunteers
    WHERE shift_id = NEW.shift_id
  ) >= 4 THEN
    RAISE EXCEPTION 'Shift is full';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for shift signup validation
DROP TRIGGER IF EXISTS validate_shift_signup_trigger ON shift_volunteers;
CREATE TRIGGER validate_shift_signup_trigger
  BEFORE INSERT ON shift_volunteers
  FOR EACH ROW
  EXECUTE FUNCTION validate_shift_signup();