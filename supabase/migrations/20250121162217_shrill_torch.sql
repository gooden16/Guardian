/*
  # Fix authentication policies and admin user handling

  1. Changes
    - Drop and recreate policies to fix recursion
    - Update admin user handling to avoid duplicates
    - Improve error handling for user creation
  
  2. Security
    - Maintain proper row-level security
    - Ensure admin access
    - Handle existing users properly
*/

-- Drop all existing policies for users table
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON users;
DROP POLICY IF EXISTS "Enable self-update for users" ON users;
DROP POLICY IF EXISTS "Enable insert for admins" ON users;
DROP POLICY IF EXISTS "Enable delete for admins" ON users;

-- Create new simplified policies without recursion
CREATE POLICY "Allow read access for authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Allow admins to insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Allow admins to delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

-- Update existing admin user if exists
UPDATE public.users
SET 
  role = 'ADMIN',
  is_active = true,
  quarterly_required = 0,
  quarterly_completed = 0
WHERE email = 'bweiss@gmail.com';

-- If admin user doesn't exist in auth.users, create it
DO $$ 
DECLARE
  existing_auth_user uuid;
BEGIN
  SELECT id INTO existing_auth_user
  FROM auth.users
  WHERE email = 'bweiss@gmail.com';

  IF existing_auth_user IS NULL THEN
    WITH new_auth_user AS (
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'bweiss@gmail.com',
        crypt('AdminPass123!', gen_salt('bf')),
        NOW(),
        NOW(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object(),
        NOW(),
        NOW()
      ) RETURNING id
    )
    INSERT INTO public.users (
      id,
      email,
      first_name,
      last_name,
      role,
      is_active,
      quarterly_required,
      quarterly_completed
    ) 
    SELECT 
      id,
      'bweiss@gmail.com',
      'Benjamin',
      'Weiss',
      'ADMIN',
      true,
      0,
      0
    FROM new_auth_user
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;