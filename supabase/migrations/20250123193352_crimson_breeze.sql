/*
  # Add Late shifts
  
  1. Changes
    - Add all Late shifts for holidays and special days
*/

-- Insert Late shifts
INSERT INTO shifts (name, date, start_time, end_time, total_slots, filled_slots, shift_type)
SELECT 
  parasha,  -- Holiday/Parasha name
  TO_DATE(date, 'MM/DD/YYYY'),  -- Convert date string to date
  '10:10'::time,  -- Late shift start time
  '12:00'::time,  -- Late shift end time
  4,  -- Total slots (1 TL + 2 L1 + 1 L2)
  0,   -- Start with 0 filled slots
  'Late'::shift_type
FROM (
VALUES
  ('פֶּסַח א׳', '4/13/2025'),
  ('פֶּסַח ב׳', '4/14/2025'),
  ('פֶּסַח ז׳', '4/19/2025'),
  ('פֶּסַח ח׳', '4/20/2025'),
  ('שָׁבוּעוֹת א׳', '6/2/2025'),
  ('שָׁבוּעוֹת ב׳', '6/3/2025'),
  ('תִּשְׁעָה בְּאָב', '8/3/2025'),
  ('סליחות', '9/13/2025'),
  ('רֹאשׁ הַשָּׁנָה א׳', '9/23/2025'),
  ('רֹאשׁ הַשָּׁנָה ב׳', '9/24/2025'),
  ('יוֹם כִּפּוּר', '10/2/2025'),
  ('סוּכּוֹת א׳', '10/7/2025'),
  ('סוּכּוֹת ב׳', '10/8/2025'),
  ('שְׁמִינִי עֲצֶרֶת', '10/14/2025'),
  ('שִׂמְחַת תּוֹרָה', '10/15/2025')
) AS t(parasha, date)
ON CONFLICT DO NOTHING;
