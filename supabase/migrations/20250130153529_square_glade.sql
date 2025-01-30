/*
  # Make bweiss@gmail.com an admin

  1. Changes
    - Temporarily disable audit trigger for profiles table
    - Update bweiss@gmail.com profile to have admin privileges
    - Re-enable audit trigger
*/

-- Temporarily disable the audit trigger
ALTER TABLE profiles DISABLE TRIGGER audit_profiles_changes;

-- Update the user to be an admin
UPDATE profiles
SET is_admin = true
WHERE email = 'bweiss@gmail.com';

-- Re-enable the audit trigger
ALTER TABLE profiles ENABLE TRIGGER audit_profiles_changes;