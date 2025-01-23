/*
  # Add holiday information to shifts table

  1. Changes
    - Add `name` column to store holiday/parasha name
    - Add `shift_type` enum for shift types (Early, Late, Evening)
    - Update shifts table constraints

  2. Security
    - Maintain existing RLS policies
*/

-- Create shift type enum
DO $$ BEGIN
  CREATE TYPE shift_type AS ENUM ('Early', 'Late', 'Evening');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to shifts table
DO $$ BEGIN
  ALTER TABLE shifts 
    ADD COLUMN IF NOT EXISTS name text NOT NULL,
    ADD COLUMN IF NOT EXISTS shift_type shift_type NOT NULL;
END $$;

-- Add index for efficient querying by date and shift type
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS shifts_date_type_idx ON shifts (date, shift_type);
END $$;