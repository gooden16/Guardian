-- Drop all existing policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Create new simplified policies
CREATE POLICY "allow_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create or update admin user
DO $$ 
DECLARE
  admin_auth_id uuid;
BEGIN
  -- Get or create auth user
  SELECT id INTO admin_auth_id
  FROM auth.users
  WHERE email = 'bweiss@gmail.com';

  IF admin_auth_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
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
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      now(),
      now()
    )
    RETURNING id INTO admin_auth_id;
  END IF;

  -- Create or update public user
  INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    quarterly_required,
    quarterly_completed
  )
  VALUES (
    admin_auth_id,
    'bweiss@gmail.com',
    'Benjamin',
    'Weiss',
    'ADMIN',
    true,
    0,
    0
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    id = EXCLUDED.id,
    role = 'ADMIN',
    is_active = true;
END $$;