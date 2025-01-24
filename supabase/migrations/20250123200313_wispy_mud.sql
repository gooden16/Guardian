/*
  # Add name field to profiles

  1. Changes
    - Add first_name and last_name columns to profiles table
    - Make them required fields with default empty strings
    - Update handle_new_user function to include names
*/

-- Add name columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '';
