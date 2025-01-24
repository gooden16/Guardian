/*
  # Add avatar support to profiles

  1. Changes
    - Add avatar_url column to profiles table
    - Enable storage for avatars
    - Update RLS policies for avatar updates
*/

-- Enable storage if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add avatar_url to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Update RLS policies to allow avatar updates
CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
