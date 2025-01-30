/*
  # Populate shifts for 2025
  
  1. Changes
    - Adds shifts for all Shabbatot in 2025
    - Creates both early and late shifts for each date
*/

-- Function to get Shabbat dates for 2025
CREATE OR REPLACE FUNCTION get_shabbat_dates_2025()
RETURNS TABLE(shabbat_date DATE) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dates AS (
    -- Start with first Saturday of 2025
    SELECT '2025-01-04'::DATE AS date
    UNION ALL
    SELECT date + '7 days'::INTERVAL
    FROM dates
    WHERE date < '2025-12-31'
  )
  SELECT date FROM dates;
END;
$$ LANGUAGE plpgsql;

-- Populate shifts for all Shabbatot in 2025
DO $$ 
DECLARE 
  shabbat_date DATE;
BEGIN
  FOR shabbat_date IN SELECT * FROM get_shabbat_dates_2025() LOOP
    -- Create early shift
    INSERT INTO shifts (date, type)
    VALUES (shabbat_date, 'early')
    ON CONFLICT (date, type) DO NOTHING;

    -- Create late shift
    INSERT INTO shifts (date, type)
    VALUES (shabbat_date, 'late')
    ON CONFLICT (date, type) DO NOTHING;
  END LOOP;
END $$;