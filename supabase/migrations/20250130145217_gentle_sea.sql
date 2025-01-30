/*
  # Fix table relationships and add missing constraints

  1. Changes
    - Add explicit foreign key relationship between shift_volunteers and profiles
    - Add missing indexes for better query performance
    - Update RLS policies to use proper joins
*/

-- Add explicit foreign key relationship between shift_volunteers and profiles
ALTER TABLE shift_volunteers
  ADD CONSTRAINT shift_volunteers_user_profile_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Add composite index for profile lookups
CREATE INDEX idx_shift_volunteers_user_profile
ON shift_volunteers(user_id, shift_id);

-- Update shift volunteers policies to use proper joins
DROP POLICY IF EXISTS "Users can sign up for shifts" ON shift_volunteers;
CREATE POLICY "Users can sign up for shifts"
  ON shift_volunteers
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_id
    )
    AND (
      -- Check if shift is not full (max 4 volunteers per shift)
      SELECT COUNT(*) < 4
      FROM shift_volunteers sv
      WHERE sv.shift_id = shift_volunteers.shift_id
    )
  );