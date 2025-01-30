/*
  # Populate Hebrew parasha names

  1. Changes
    - Creates a function to fetch and update Hebrew parasha names for existing shifts
    - Populates all existing shifts with Hebrew parasha names from HebCal
*/

-- Create function to update Hebrew parasha names for a specific date
CREATE OR REPLACE FUNCTION update_hebrew_parasha_for_date(shift_date DATE)
RETURNS void AS $$
DECLARE
  event JSON;
BEGIN
  -- Fetch parasha info from HebCal API
  SELECT content::json->'items'->0 INTO event
  FROM http_get('https://www.hebcal.com/hebcal?v=1&cfg=json&year=' || 
                EXTRACT(YEAR FROM shift_date)::text ||
                '&month=' || EXTRACT(MONTH FROM shift_date)::text ||
                '&day=' || EXTRACT(DAY FROM shift_date)::text ||
                '&i=off&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on');

  -- Update shifts for this date if it's a parasha
  IF event->>'category' = 'parashat' THEN
    UPDATE shifts
    SET hebrew_parasha = event->>'hebrew'
    WHERE date = shift_date
    AND hebrew_parasha IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Populate existing shifts
DO $$
DECLARE
  shift_date DATE;
BEGIN
  -- Get unique dates from shifts table
  FOR shift_date IN 
    SELECT DISTINCT date 
    FROM shifts 
    WHERE hebrew_parasha IS NULL
    ORDER BY date
  LOOP
    -- Update Hebrew parasha for each date
    PERFORM update_hebrew_parasha_for_date(shift_date);
    -- Add a small delay to avoid rate limiting
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;