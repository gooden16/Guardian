/*
  # Add profile picture support

  1. Changes
    - Add `profile_url` column to users table
    - Create storage bucket for avatars
    - Add storage policies for avatar uploads

  2. Security
    - Enable RLS for storage bucket
    - Add policy for authenticated users to read/write their own avatars
*/

-- Add profile_url column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'profile_url'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_url text;
  END IF;
END $$;

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name)
SELECT 'avatars', 'avatars'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

-- Enable RLS for avatars bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-pictures' AND
  auth.uid()::text = SPLIT_PART(SPLIT_PART(name, '/', 2), '-', 1)
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-pictures' AND
  auth.uid()::text = SPLIT_PART(SPLIT_PART(name, '/', 2), '-', 1)
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-pictures' AND
  auth.uid()::text = SPLIT_PART(SPLIT_PART(name, '/', 2), '-', 1)
);

-- Allow public access to avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');