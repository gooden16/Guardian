/*
  # Update shift dates to Saturday mornings

  1. Changes
    - Updates existing shift dates to be Saturday mornings instead of Friday evenings
    - Modifies ensure_shifts_exist function to handle Saturday dates correctly
    - Updates Hebrew parasha data for correct dates

  2. Notes
    - Preserves all existing shift data while adjusting dates
    - Maintains RLS policies and constraints
*/

-- First, update all existing shift dates to Saturday
UPDATE shifts
SET date = date + interval '1 day'
WHERE EXTRACT(DOW FROM date) = 5;  -- Only update Friday dates

-- Update the ensure_shifts_exist function to handle Saturday dates
CREATE OR REPLACE FUNCTION ensure_shifts_exist(start_date DATE, end_date DATE)
RETURNS SETOF shifts AS $$
DECLARE
  current_date DATE;
BEGIN
  -- Check if the user is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can create shifts';
  END IF;

  -- Create shifts only for Saturdays in the date range
  FOR current_date IN 
    SELECT d::date
    FROM generate_series(
      -- Ensure we start on a Saturday
      CASE 
        WHEN EXTRACT(DOW FROM start_date) = 6 THEN start_date
        ELSE start_date + ((6 - EXTRACT(DOW FROM start_date))::integer % 7 || ' days')::interval
      END,
      end_date,
      '7 days'::interval
    ) d
  LOOP
    -- Create early shift if it doesn't exist
    INSERT INTO shifts (date, type)
    VALUES (current_date, 'early')
    ON CONFLICT (date, type) DO NOTHING;

    -- Create late shift if it doesn't exist
    INSERT INTO shifts (date, type)
    VALUES (current_date, 'late')
    ON CONFLICT (date, type) DO NOTHING;
  END LOOP;

  -- Return all shifts in the date range
  RETURN QUERY
  SELECT * FROM shifts
  WHERE date BETWEEN start_date AND end_date
  ORDER BY date, type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the Hebrew parasha data for 2025 with correct Saturday dates
WITH parasha_dates AS (
  SELECT 
    date + interval '1 day' as date,  -- Convert Friday dates to Saturday
    hebrew_name
  FROM (
    VALUES 
      ('2025-01-03'::date, 'שְׁמוֹת'),
      ('2025-01-10'::date, 'וָאֵרָא'),
      ('2025-01-17'::date, 'בֹּא'),
      ('2025-01-24'::date, 'בְּשַׁלַּח'),
      ('2025-01-31'::date, 'יִתְרוֹ'),
      ('2025-02-07'::date, 'מִּשְׁפָּטִים'),
      ('2025-02-14'::date, 'תְּרוּמָה'),
      ('2025-02-21'::date, 'תְּצַוֶּה'),
      ('2025-02-28'::date, 'כִּי תִשָּׂא'),
      ('2025-03-07'::date, 'וַיַּקְהֵל-פְקוּדֵי'),
      ('2025-03-14'::date, 'וַיִּקְרָא'),
      ('2025-03-21'::date, 'צַו'),
      ('2025-03-28'::date, 'שְׁמִינִי'),
      ('2025-04-04'::date, 'תַזְרִיעַ-מְצֹרָע'),
      ('2025-04-11'::date, 'אַחֲרֵי מוֹת-קְדשִׁים'),
      ('2025-04-18'::date, 'אֱמֹר'),
      ('2025-04-25'::date, 'בְּהַר-בְּחֻקֹּתַי'),
      ('2025-05-02'::date, 'בְּמִדְבַּר'),
      ('2025-05-09'::date, 'נָשֹא'),
      ('2025-05-16'::date, 'בְּהַעֲלֹתְךָ'),
      ('2025-05-23'::date, 'שְׁלַח-לְךָ'),
      ('2025-05-30'::date, 'קֹרַח'),
      ('2025-06-06'::date, 'חֻקַּת'),
      ('2025-06-13'::date, 'בָּלָק'),
      ('2025-06-20'::date, 'פִּינְחָס'),
      ('2025-06-27'::date, 'מַטּוֹת-מַסְעֵי'),
      ('2025-07-04'::date, 'דְּבָרִים'),
      ('2025-07-11'::date, 'וָאֶתְחַנַּן'),
      ('2025-07-18'::date, 'עֵקֶב'),
      ('2025-07-25'::date, 'רְאֵה'),
      ('2025-08-01'::date, 'שֹׁפְטִים'),
      ('2025-08-08'::date, 'כִּי-תֵצֵא'),
      ('2025-08-15'::date, 'כִּי-תָבוֹא'),
      ('2025-08-22'::date, 'נִצָּבִים-וַיֵּלֶךְ'),
      ('2025-08-29'::date, 'הַאֲזִינוּ'),
      ('2025-09-05'::date, 'וְזֹאת הַבְּרָכָה'),
      ('2025-09-12'::date, 'בְּרֵאשִׁית'),
      ('2025-09-19'::date, 'נֹחַ'),
      ('2025-09-26'::date, 'לֶךְ-לְךָ'),
      ('2025-10-03'::date, 'וַיֵּרָא'),
      ('2025-10-10'::date, 'חַיֵּי שָׂרָה'),
      ('2025-10-17'::date, 'תּוֹלְדֹת'),
      ('2025-10-24'::date, 'וַיֵּצֵא'),
      ('2025-10-31'::date, 'וַיִּשְׁלַח'),
      ('2025-11-07'::date, 'וַיֵּשֶׁב'),
      ('2025-11-14'::date, 'מִקֵּץ'),
      ('2025-11-21'::date, 'וַיִּגַּשׁ'),
      ('2025-11-28'::date, 'וַיְחִי'),
      ('2025-12-05'::date, 'שְׁמוֹת'),
      ('2025-12-12'::date, 'וָאֵרָא'),
      ('2025-12-19'::date, 'בֹּא'),
      ('2025-12-26'::date, 'בְּשַׁלַּח')
  ) AS t(date, hebrew_name)
)
UPDATE shifts s
SET hebrew_parasha = pd.hebrew_name
FROM parasha_dates pd
WHERE s.date = pd.date;