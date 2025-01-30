/*
  # Fix storage bucket policies

  1. Changes
    - Add proper storage bucket policies for avatar uploads
    - Allow authenticated users to upload to their own folder
    - Allow public read access to avatars

  2. Security
    - Restrict uploads to authenticated users
    - Users can only upload to their own folder
    - Anyone can read avatar files
*/

-- Create storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (REGEXP_MATCH(name, '^avatars/([^/]+)-[^/]+\.[^.]+$'))[1]
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Allow users to update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (REGEXP_MATCH(name, '^avatars/([^/]+)-[^/]+\.[^.]+$'))[1]
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (REGEXP_MATCH(name, '^avatars/([^/]+)-[^/]+\.[^.]+$'))[1]
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Allow users to delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (REGEXP_MATCH(name, '^avatars/([^/]+)-[^/]+\.[^.]+$'))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');