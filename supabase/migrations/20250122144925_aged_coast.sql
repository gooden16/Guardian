-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Public read access" ON profiles;
DROP POLICY IF EXISTS "Update own profile" ON profiles;
DROP POLICY IF EXISTS "View shift assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Manage own assignments" ON shift_assignments;

-- Create simplified profile policies
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create simplified shift assignment policies
CREATE POLICY "Anyone can view assignments"
  ON shift_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage assignments"
  ON shift_assignments FOR INSERT
  TO authenticated
  WITH CHECK (volunteer_id = auth.uid());

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_volunteer ON shift_assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift ON shift_assignments(shift_id);

-- Add default avatar URL column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS default_avatar_url text 
DEFAULT 'https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png';

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('avatars', 'avatars')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');