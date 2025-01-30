/*
  # Fix shift volunteers query

  1. Changes
    - Drop the shift_volunteers_with_profiles view as it's no longer needed
    - Update shift_volunteers foreign key to properly reference auth.users
    - Add proper indexes for performance

  2. Security
    - Maintain existing RLS policies
*/

-- Drop the view as we'll use direct joins instead
DROP VIEW IF EXISTS shift_volunteers_with_profiles;

-- Add proper foreign key relationship
ALTER TABLE shift_volunteers
  DROP CONSTRAINT shift_volunteers_user_id_fkey,
  ADD CONSTRAINT shift_volunteers_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Add composite index for better query performance
CREATE INDEX idx_shift_volunteers_composite 
ON shift_volunteers(shift_id, user_id);