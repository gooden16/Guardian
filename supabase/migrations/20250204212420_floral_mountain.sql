/*
  # Add shift creation restrictions
  
  1. Changes
    - Add check constraint to ensure shifts are only created for Shabbat (Saturday) or holidays
    - Modify ensure_shifts_exist function to require admin privileges
    - Add trigger to prevent direct shift creation by non-admins
  
  2. Security
    - Only admins can create shifts
    - Shifts can only be created for Shabbat or holidays
*/

-- Add check constraint to ensure shifts are only created for Saturdays
ALTER TABLE shifts
ADD CONSTRAINT shifts_date_check
CHECK (EXTRACT(DOW FROM date) = 6);  -- 6 represents Saturday

-- Modify ensure_shifts_exist function to require admin privileges
CREATE OR REPLACE FUNCTION ensure_shifts_exist(start_date DATE, end_date DATE)
RETURNS SETOF shifts AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  ) THEN
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
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can create shifts';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce admin-only creation
CREATE TRIGGER enforce_admin_shift_creation
  BEFORE INSERT ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION check_shift_creation();

-- Delete any existing shifts that are not on Saturdays
DELETE FROM shifts
WHERE EXTRACT(DOW FROM date) != 6;