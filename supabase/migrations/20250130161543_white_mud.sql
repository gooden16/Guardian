/*
  # Add Hebrew parasha names

  1. Changes
    - Adds hebrew_parasha column if it doesn't exist
    - Populates known parasha names for 2025
*/

-- Add hebrew_parasha column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' AND column_name = 'hebrew_parasha'
  ) THEN
    ALTER TABLE shifts ADD COLUMN hebrew_parasha TEXT;
  END IF;
END $$;

-- Populate Hebrew parasha names for 2025
WITH parasha_dates AS (
  SELECT 
    date,
    hebrew_name
  FROM (
    VALUES 
      ('2025-01-04'::date, 'שְׁמוֹת'),
      ('2025-01-11'::date, 'וָאֵרָא'),
      ('2025-01-18'::date, 'בֹּא'),
      ('2025-01-25'::date, 'בְּשַׁלַּח'),
      ('2025-02-01'::date, 'יִתְרוֹ'),
      ('2025-02-08'::date, 'מִּשְׁפָּטִים'),
      ('2025-02-15'::date, 'תְּרוּמָה'),
      ('2025-02-22'::date, 'תְּצַוֶּה'),
      ('2025-03-01'::date, 'כִּי תִשָּׂא'),
      ('2025-03-08'::date, 'וַיַּקְהֵל-פְקוּדֵי'),
      ('2025-03-15'::date, 'וַיִּקְרָא'),
      ('2025-03-22'::date, 'צַו'),
      ('2025-03-29'::date, 'שְׁמִינִי'),
      ('2025-04-05'::date, 'תַזְרִיעַ-מְצֹרָע'),
      ('2025-04-12'::date, 'אַחֲרֵי מוֹת-קְדשִׁים'),
      ('2025-04-19'::date, 'אֱמֹר'),
      ('2025-04-26'::date, 'בְּהַר-בְּחֻקֹּתַי'),
      ('2025-05-03'::date, 'בְּמִדְבַּר'),
      ('2025-05-10'::date, 'נָשֹא'),
      ('2025-05-17'::date, 'בְּהַעֲלֹתְךָ'),
      ('2025-05-24'::date, 'שְׁלַח-לְךָ'),
      ('2025-05-31'::date, 'קֹרַח'),
      ('2025-06-07'::date, 'חֻקַּת'),
      ('2025-06-14'::date, 'בָּלָק'),
      ('2025-06-21'::date, 'פִּינְחָס'),
      ('2025-06-28'::date, 'מַטּוֹת-מַסְעֵי'),
      ('2025-07-05'::date, 'דְּבָרִים'),
      ('2025-07-12'::date, 'וָאֶתְחַנַּן'),
      ('2025-07-19'::date, 'עֵקֶב'),
      ('2025-07-26'::date, 'רְאֵה'),
      ('2025-08-02'::date, 'שֹׁפְטִים'),
      ('2025-08-09'::date, 'כִּי-תֵצֵא'),
      ('2025-08-16'::date, 'כִּי-תָבוֹא'),
      ('2025-08-23'::date, 'נִצָּבִים-וַיֵּלֶךְ'),
      ('2025-08-30'::date, 'הַאֲזִינוּ'),
      ('2025-09-06'::date, 'וְזֹאת הַבְּרָכָה'),
      ('2025-09-13'::date, 'בְּרֵאשִׁית'),
      ('2025-09-20'::date, 'נֹחַ'),
      ('2025-09-27'::date, 'לֶךְ-לְךָ'),
      ('2025-10-04'::date, 'וַיֵּרָא'),
      ('2025-10-11'::date, 'חַיֵּי שָׂרָה'),
      ('2025-10-18'::date, 'תּוֹלְדֹת'),
      ('2025-10-25'::date, 'וַיֵּצֵא'),
      ('2025-11-01'::date, 'וַיִּשְׁלַח'),
      ('2025-11-08'::date, 'וַיֵּשֶׁב'),
      ('2025-11-15'::date, 'מִקֵּץ'),
      ('2025-11-22'::date, 'וַיִּגַּשׁ'),
      ('2025-11-29'::date, 'וַיְחִי'),
      ('2025-12-06'::date, 'שְׁמוֹת'),
      ('2025-12-13'::date, 'וָאֵרָא'),
      ('2025-12-20'::date, 'בֹּא'),
      ('2025-12-27'::date, 'בְּשַׁלַּח')
  ) AS t(date, hebrew_name)
)
UPDATE shifts s
SET hebrew_parasha = pd.hebrew_name
FROM parasha_dates pd
WHERE s.date = pd.date
AND s.hebrew_parasha IS NULL;