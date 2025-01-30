/*
  # Make bweiss@gmail.com an admin

  1. Changes
    - Updates the profile for bweiss@gmail.com to have admin privileges
*/

UPDATE profiles
SET is_admin = true
WHERE email = 'bweiss@gmail.com';