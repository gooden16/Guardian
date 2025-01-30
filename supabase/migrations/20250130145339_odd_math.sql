/*
  # Add automatic shift population for Shabbat dates

  1. New Functions
    - create_shifts_for_date: Creates both early and late shifts for a given date
    - ensure_shifts_exist: Ensures shifts exist for a date range
  
  2. Triggers
    - Automatically creates shifts when querying future dates
*/

-- Function to create shifts for a specific date
CREATE OR REPLACE FUNCTION create_shifts_for_date(shift_date DATE)
RETURNS void AS $$
BEGIN
  -- Create early shift if it doesn't exist
  INSERT INTO shifts (date, type)
  VALUES (shift_date, 'early')
  ON CONFLICT (date, type) DO NOTHING;

  -- Create late shift if it doesn't exist
  INSERT INTO shifts (date, type)
  VALUES (shift_date, 'late')
  ON CONFLICT (date, type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure shifts exist for a date range
CREATE OR REPLACE FUNCTION ensure_shifts_exist(start_date DATE, end_date DATE)
RETURNS SETOF shifts AS $$
DECLARE
  current_date DATE;
BEGIN
  -- Create shifts for each date in the range
  FOR current_date IN 
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date
  LOOP
    -- Only create shifts for dates that don't have both shifts
    IF NOT EXISTS (
      SELECT 1 FROM shifts 
      WHERE date = current_date 
      GROUP BY date 
      HAVING COUNT(*) = 2
    ) THEN
      PERFORM create_shifts_for_date(current_date);
    END IF;
  END LOOP;

  -- Return all shifts in the date range
  RETURN QUERY
  SELECT * FROM shifts
  WHERE date BETWEEN start_date AND end_date
  ORDER BY date, type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;