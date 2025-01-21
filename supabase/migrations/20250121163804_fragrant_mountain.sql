-- Drop all existing policies
DROP POLICY IF EXISTS "allow_read" ON users;
DROP POLICY IF EXISTS "allow_insert" ON users;
DROP POLICY IF EXISTS "allow_update" ON users;

-- Create new simplified policies
CREATE POLICY "users_select_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR role = 'ADMIN')
  WITH CHECK (auth.uid() = id OR role = 'ADMIN');

-- Update admin user if exists, otherwise create new one
DO $$ 
DECLARE
  admin_auth_id uuid;
  admin_exists boolean;
BEGIN
  -- Check if admin exists in public.users
  SELECT EXISTS (
    SELECT 1 FROM users WHERE email = 'bweiss@gmail.com'
  ) INTO admin_exists;

  IF admin_exists THEN
    -- Update existing admin user
    UPDATE users
    SET 
      role = 'ADMIN',
      is_active = true,
      quarterly_required = 0,
      quarterly_completed = 0
    WHERE email = 'bweiss@gmail.com';
  ELSE
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
        '{"role": "ADMIN"}',
        now(),
        now()
      )
      RETURNING id INTO admin_auth_id;

      -- Create public user only if auth user was created
      INSERT INTO users (
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        quarterly_required,
        quarterly_completed
      ) VALUES (
        admin_auth_id,
        'bweiss@gmail.com',
        'Benjamin',
        'Weiss',
        'ADMIN',
        true,
        0,
        0
      );
    END IF;
  END IF;
END $$;