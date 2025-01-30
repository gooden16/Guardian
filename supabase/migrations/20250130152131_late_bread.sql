/*
  # Fix avatar storage path and policies

  1. Changes
    - Update storage policies to match the correct avatar path pattern
    - Fix path validation regex to match code implementation
    - Ensure consistent path structure between policies and application code

  2. Security
    - Maintain user isolation - users can only access their own avatars
    - Keep public read access for avatars
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Create new policies with correct path pattern
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)-[^/]+\.[^.]+$'))[1]
);

CREATE POLICY "Allow users to update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)-[^/]+\.[^.]+$'))[1]
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)-[^/]+\.[^.]+$'))[1]
);

CREATE POLICY "Allow users to delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)-[^/]+\.[^.]+$'))[1]
);

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');