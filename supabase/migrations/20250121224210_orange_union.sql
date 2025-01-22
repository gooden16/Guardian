/*
  # Populate shifts for 2025
  
  1. Overview
    - Adds unique constraint on date and time columns
    - Adds shifts for Shabbatot starting February 1st, 2025
    - Adds shifts for Jewish holidays in 2025
    - Each day has early morning (8:35-10:20) and late morning (10:10-12:00) shifts
    - Some holidays also have evening shifts

  2. Changes
    - Add unique constraint on (date, time)
    - Insert all Shabbat and holiday shifts
*/

-- Add unique constraint for date and time
ALTER TABLE shifts ADD CONSTRAINT shifts_date_time_unique UNIQUE (date, time);

-- Function to insert a shift
CREATE OR REPLACE FUNCTION insert_shift(shift_date date, shift_time text)
RETURNS void AS $$
BEGIN
  INSERT INTO shifts (date, time)
  VALUES (shift_date, shift_time)
  ON CONFLICT (date, time) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Insert Shabbat shifts for 2025 (starting February 1st)
DO $$
DECLARE
  shift_date date := '2025-02-01';
  end_date date := '2025-12-31';
BEGIN
  WHILE shift_date <= end_date LOOP
    IF EXTRACT(DOW FROM shift_date) = 6 THEN -- Saturday
      -- Early morning shift
      PERFORM insert_shift(shift_date, 'EARLY_MORNING');
      -- Late morning shift
      PERFORM insert_shift(shift_date, 'LATE_MORNING');
    END IF;
    shift_date := shift_date + interval '1 day';
  END LOOP;
END $$;

-- Insert Holiday shifts for 2025
DO $$
BEGIN
  -- Tu BiShvat (No evening shift)
  PERFORM insert_shift('2025-02-13', 'EARLY_MORNING');
  PERFORM insert_shift('2025-02-13', 'LATE_MORNING');

  -- Purim (Including evening)
  PERFORM insert_shift('2025-03-14', 'EVENING');
  PERFORM insert_shift('2025-03-15', 'EARLY_MORNING');
  PERFORM insert_shift('2025-03-15', 'LATE_MORNING');

  -- Pesach
  -- First Days
  PERFORM insert_shift('2025-04-12', 'EVENING');
  PERFORM insert_shift('2025-04-13', 'EARLY_MORNING');
  PERFORM insert_shift('2025-04-13', 'LATE_MORNING');
  PERFORM insert_shift('2025-04-14', 'EARLY_MORNING');
  PERFORM insert_shift('2025-04-14', 'LATE_MORNING');
  
  -- Last Days
  PERFORM insert_shift('2025-04-19', 'EVENING');
  PERFORM insert_shift('2025-04-20', 'EARLY_MORNING');
  PERFORM insert_shift('2025-04-20', 'LATE_MORNING');
  PERFORM insert_shift('2025-04-21', 'EARLY_MORNING');
  PERFORM insert_shift('2025-04-21', 'LATE_MORNING');

  -- Shavuot
  PERFORM insert_shift('2025-06-01', 'EVENING');
  PERFORM insert_shift('2025-06-02', 'EARLY_MORNING');
  PERFORM insert_shift('2025-06-02', 'LATE_MORNING');
  PERFORM insert_shift('2025-06-03', 'EARLY_MORNING');
  PERFORM insert_shift('2025-06-03', 'LATE_MORNING');

  -- Rosh Hashana
  PERFORM insert_shift('2025-09-22', 'EVENING');
  PERFORM insert_shift('2025-09-23', 'EARLY_MORNING');
  PERFORM insert_shift('2025-09-23', 'LATE_MORNING');
  PERFORM insert_shift('2025-09-24', 'EARLY_MORNING');
  PERFORM insert_shift('2025-09-24', 'LATE_MORNING');

  -- Yom Kippur
  PERFORM insert_shift('2025-10-01', 'EVENING');
  PERFORM insert_shift('2025-10-02', 'EARLY_MORNING');
  PERFORM insert_shift('2025-10-02', 'LATE_MORNING');

  -- Sukkot
  -- First Days
  PERFORM insert_shift('2025-10-06', 'EVENING');
  PERFORM insert_shift('2025-10-07', 'EARLY_MORNING');
  PERFORM insert_shift('2025-10-07', 'LATE_MORNING');
  PERFORM insert_shift('2025-10-08', 'EARLY_MORNING');
  PERFORM insert_shift('2025-10-08', 'LATE_MORNING');
  
  -- Shemini Atzeret/Simchat Torah
  PERFORM insert_shift('2025-10-13', 'EVENING');
  PERFORM insert_shift('2025-10-14', 'EARLY_MORNING');
  PERFORM insert_shift('2025-10-14', 'LATE_MORNING');
  PERFORM insert_shift('2025-10-15', 'EARLY_MORNING');
  PERFORM insert_shift('2025-10-15', 'LATE_MORNING');
END $$;
