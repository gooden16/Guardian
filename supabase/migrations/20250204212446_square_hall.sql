/*
  # Add shift creation restrictions
  
  1. Changes
    - Delete existing non-Saturday shifts
    - Add check constraint for Saturday-only shifts
    - Modify functions to require admin privileges
  
  2. Security
    - Only admins can create shifts
    - Shifts can only be created for Saturdays
*/

-- First, delete any existing shifts that are not on Saturdays
DELETE FROM shifts
WHERE EXTRACT(DOW FROM date) != 6;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modify ensure_shifts_exist function to require admin privileges
CREATE OR REPLACE FUNCTION ensure_shifts_exist(start_date DATE, end_date DATE)
RETURNS SETOF shifts AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can create shifts';
  END IF;

  -- Create shifts only for Saturdays in the date range
  FOR date_value IN 
    SELECT d::date
    FROM generate_series(start_date, end_date, '1 day'::interval) d
    WHERE EXTRACT(DOW FROM d) = 6  -- Only Saturdays
  LOOP
    -- Create early shift if it doesn't exist
    INSERT INTO shifts (date, type)
    VALUES (date_value, 'early')
    ON CONFLICT (date, type) DO NOTHING;

    -- Create late shift if it doesn't exist
    INSERT INTO shifts (date, type)
    VALUES (date_value, 'late')
    ON CONFLICT (date, type) DO NOTHING;
  END LOOP;

  -- Return all shifts in the date range
  RETURN QUERY
  SELECT * FROM shifts
  WHERE date BETWEEN start_date AND end_date
  ORDER BY date, type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to prevent direct shift creation by non-admins
CREATE OR REPLACE FUNCTION check_shift_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can create shifts';
  END IF;

  -- Check if the date is a Saturday
  IF EXTRACT(DOW FROM NEW.date) != 6 THEN
    RAISE EXCEPTION 'Shifts can only be created for Saturdays';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce admin-only creation and Saturday-only dates
DROP TRIGGER IF EXISTS enforce_shift_creation_rules ON shifts;
CREATE TRIGGER enforce_shift_creation_rules
  BEFORE INSERT OR UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION check_shift_creation();

-- Add check constraint for Saturday-only shifts
ALTER TABLE shifts
ADD CONSTRAINT shifts_saturday_only
CHECK (EXTRACT(DOW FROM date) = 6);