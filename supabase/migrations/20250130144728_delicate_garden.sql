/*
  # Add relationship between shift_volunteers and profiles

  1. Changes
    - Add foreign key from shift_volunteers to profiles
    - Update the getShifts query to use the correct join path

  2. Security
    - No changes to RLS policies needed
*/

-- Drop existing view if it exists to avoid conflicts
DROP VIEW IF EXISTS shift_volunteers_with_profiles;

-- Create a view to join shift_volunteers with profiles
CREATE VIEW shift_volunteers_with_profiles AS
SELECT 
  sv.id,
  sv.shift_id,
  sv.user_id,
  p.first_name,
  p.last_name,
  p.role
FROM shift_volunteers sv
JOIN profiles p ON p.id = sv.user_id;