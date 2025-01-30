/*
  # Fix ensure_shifts_exist function

  1. Changes
    - Remove HTTP call dependency from ensure_shifts_exist function
    - Simplify function to just create shifts without Hebrew names
    - Hebrew names will be populated by the previous migration
*/

-- Drop and recreate ensure_shifts_exist function without HTTP dependency
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
      -- Create early shift
      INSERT INTO shifts (date, type)
      VALUES (current_date, 'early')
      ON CONFLICT (date, type) DO NOTHING;

      -- Create late shift
      INSERT INTO shifts (date, type)
      VALUES (current_date, 'late')
      ON CONFLICT (date, type) DO NOTHING;
    END IF;
  END LOOP;

  -- Return all shifts in the date range
  RETURN QUERY
  SELECT * FROM shifts
  WHERE date BETWEEN start_date AND end_date
  ORDER BY date, type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;