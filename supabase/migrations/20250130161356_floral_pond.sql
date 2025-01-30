/*
  # Add Hebrew parasha name to shifts

  1. Changes
    - Add hebrew_parasha column to shifts table
    - Update ensure_shifts_exist function to include Hebrew name
*/

-- Add hebrew_parasha column to shifts table
ALTER TABLE shifts
ADD COLUMN hebrew_parasha TEXT;

-- Update the ensure_shifts_exist function to include Hebrew name
CREATE OR REPLACE FUNCTION ensure_shifts_exist(start_date DATE, end_date DATE)
RETURNS SETOF shifts AS $$
DECLARE
  current_date DATE;
  response JSON;
  event JSON;
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
      -- Fetch parasha info from HebCal API
      SELECT content::json->'items'->0 INTO event
      FROM http_get('https://www.hebcal.com/hebcal?v=1&cfg=json&year=' || 
                    EXTRACT(YEAR FROM current_date)::text ||
                    '&month=' || EXTRACT(MONTH FROM current_date)::text ||
                    '&day=' || EXTRACT(DAY FROM current_date)::text ||
                    '&i=off&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on');

      -- Create early shift
      INSERT INTO shifts (date, type, hebrew_parasha)
      VALUES (
        current_date, 
        'early',
        CASE 
          WHEN event->>'category' = 'parashat' THEN event->>'hebrew'
          ELSE NULL
        END
      )
      ON CONFLICT (date, type) DO UPDATE
      SET hebrew_parasha = EXCLUDED.hebrew_parasha
      WHERE shifts.hebrew_parasha IS NULL;

      -- Create late shift
      INSERT INTO shifts (date, type, hebrew_parasha)
      VALUES (
        current_date, 
        'late',
        CASE 
          WHEN event->>'category' = 'parashat' THEN event->>'hebrew'
          ELSE NULL
        END
      )
      ON CONFLICT (date, type) DO UPDATE
      SET hebrew_parasha = EXCLUDED.hebrew_parasha
      WHERE shifts.hebrew_parasha IS NULL;
    END IF;
  END LOOP;

  -- Return all shifts in the date range
  RETURN QUERY
  SELECT * FROM shifts
  WHERE date BETWEEN start_date AND end_date
  ORDER BY date, type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;