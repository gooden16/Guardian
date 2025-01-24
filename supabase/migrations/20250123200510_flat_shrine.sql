/*
  # Add phone number to profiles

  1. Changes
    - Add phone_number column to profiles table
    - Make it optional to allow gradual adoption
*/

-- Add phone number column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number text;
