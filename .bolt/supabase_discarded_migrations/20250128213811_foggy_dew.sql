/*
  # Add admin column to volunteers table

  1. Changes
    - Add is_admin boolean column to volunteers table
  
  2. Security
    - Default value of false for new volunteers
*/

DO $$ BEGIN
  ALTER TABLE volunteers 
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
END $$;