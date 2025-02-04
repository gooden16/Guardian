/*
  # Fix avatar storage policies

  1. Changes
    - Drop existing storage policies
    - Create new policies with proper RLS rules
    - Add proper bucket configuration
*/

-- Recreate avatars bucket with proper configuration
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO UPDATE
  SET public = true;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Create new policies with proper RLS rules
CREATE POLICY "Allow users to manage own avatars"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Allow public read access to avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Create folders for each user
CREATE OR REPLACE FUNCTION storage.create_user_folder()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a folder for the new user
  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES ('avatars', NEW.id || '/', NEW.id, '{"isFolder": true}')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create user folders
DROP TRIGGER IF EXISTS create_user_folder_on_signup ON auth.users;
CREATE TRIGGER create_user_folder_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION storage.create_user_folder();