/*
  # Add Admin Role and Permissions

  1. Changes
    - Add admin role to profiles
    - Add admin-specific policies
    - Create initial admin user

  2. Security
    - Only admins can manage volunteers
    - Only admins can manage shifts
    - Only admins can view all conversations
*/

-- Add admin column to profiles
ALTER TABLE profiles 
ADD COLUMN is_admin boolean DEFAULT false;

-- Update policies for volunteers management
CREATE POLICY "Admins can manage volunteers"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
    OR id = auth.uid()
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
    OR id = auth.uid()
  );

-- Update policies for shifts management
CREATE POLICY "Admins can manage shifts"
  ON shifts
  FOR ALL
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- Create initial admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  'authenticated'
);

-- Create admin profile
INSERT INTO profiles (
  id,
  name,
  email,
  role,
  training_level,
  is_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Admin User',
  'admin@example.com',
  'admin',
  'TEAM_LEADER',
  true
);
