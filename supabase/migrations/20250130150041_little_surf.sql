/*
  # Populate shifts for 2025
  
  1. Changes
    - Adds shifts for all Shabbatot in 2025
    - Creates both early and late shifts for each date
  
  2. Implementation
    - Uses generate_series for date generation
    - Handles date type consistently
    - Uses existing create_shifts_for_date function
*/

-- Function to get all Shabbat dates in 2025
CREATE OR REPLACE FUNCTION get_shabbat_dates_2025()
RETURNS TABLE(shabbat_date DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT date::date
  FROM generate_series(
    '2025-01-04'::date,  -- First Saturday of 2025
    '2025-12-27'::date,  -- Last Saturday of 2025
    '7 days'::interval
  ) AS date;
END;
$$ LANGUAGE plpgsql;

-- Populate shifts for all Shabbatot in 2025
DO $$ 
DECLARE 
  shabbat_date DATE;
BEGIN
  FOR shabbat_date IN SELECT * FROM get_shabbat_dates_2025() LOOP
    -- Use the existing create_shifts_for_date function
    PERFORM create_shifts_for_date(shabbat_date);
  END LOOP;
END $$;