/*
  # Add shifts data
  
  1. Changes
    - Insert shifts data for 2025
    - Set default slots and filled slots
    - Properly cast time values
*/

-- Insert shifts data
INSERT INTO shifts (name, date, start_time, end_time, total_slots, filled_slots, shift_type)
SELECT 
  parasha,  -- Holiday/Parasha name
  TO_DATE(date, 'MM/DD/YYYY'),  -- Convert date string to date
  CASE 
    WHEN shift_type = 'Early' THEN '08:35'::time
    WHEN shift_type = 'Late' THEN '10:10'::time
    WHEN shift_type = 'Evening' THEN '18:00'::time
  END,
  CASE 
    WHEN shift_type = 'Early' THEN '10:20'::time
    WHEN shift_type = 'Late' THEN '12:00'::time
    WHEN shift_type = 'Evening' THEN '20:00'::time
  END,
  10,  -- Default total slots
  0,   -- Start with 0 filled slots
  shift_type::shift_type
FROM (
VALUES
  ('פֶּסַח א׳', '4/13/2025', 'Early'),
  ('פֶּסַח ב׳', '4/14/2025', 'Early'),
  ('פֶּסַח ז׳', '4/19/2025', 'Early'),
  ('פֶּסַח ח׳', '4/20/2025', 'Early'),
  ('שָׁבוּעוֹת א׳', '6/2/2025', 'Early'),
  ('שָׁבוּעוֹת ב׳', '6/3/2025', 'Early'),
  ('תִּשְׁעָה בְּאָב', '8/3/2025', 'Early'),
  ('סליחות', '9/13/2025', 'Early'),
  ('רֹאשׁ הַשָּׁנָה א׳', '9/23/2025', 'Early'),
  ('רֹאשׁ הַשָּׁנָה ב׳', '9/24/2025', 'Early'),
  ('יוֹם כִּפּוּר', '10/2/2025', 'Early'),
  ('סוּכּוֹת א׳', '10/7/2025', 'Early'),
  ('סוּכּוֹת ב׳', '10/8/2025', 'Early'),
  ('שְׁמִינִי עֲצֶרֶת', '10/14/2025', 'Early'),
  ('שִׂמְחַת תּוֹרָה', '10/15/2025', 'Early'),
  -- Evening shifts
  ('עֶרֶב פּוּרִים', '3/13/2025', 'Evening'),
  ('עֶרֶב פֶּסַח', '4/12/2025', 'Evening'),
  ('יוֹם הַשּׁוֹאָה', '4/24/2025', 'Evening'),
  ('יוֹם הַזִּכָּרוֹן', '4/30/2025', 'Evening'),
  ('יוֹם הָעַצְמָאוּת', '5/1/2025', 'Evening'),
  ('עֶרֶב שָׁבוּעוֹת', '6/1/2025', 'Evening'),
  ('עֶרֶב תִּשְׁעָה בְּאָב', '8/2/2025', 'Evening'),
  ('עֶרֶב רֹאשׁ הַשָּׁנָה', '9/22/2025', 'Evening'),
  ('עֶרֶב יוֹם כִּפּוּר', '10/1/2025', 'Evening'),
  ('עֶרֶב סוּכּוֹת', '10/6/2025', 'Evening'),
  ('שְׁמִינִי עֲצֶרֶת', '10/13/2025', 'Evening'),
  ('שִׂמְחַת תּוֹרָה', '10/14/2025', 'Evening')
) AS t(parasha, date, shift_type)
ON CONFLICT DO NOTHING;