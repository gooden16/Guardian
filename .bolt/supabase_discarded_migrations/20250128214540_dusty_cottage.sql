/*
  # Create Admin User

  1. Creates the admin user in auth.users
  2. Creates the corresponding volunteer record
  3. Sets admin privileges
*/

-- Create admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@cssshiftscheduler.org'
  ) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'authenticated',
      'authenticated',
      'admin@cssshiftscheduler.org',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now()
    );
  END IF;
END $$;

-- Create admin volunteer if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM volunteers 
    WHERE email = 'admin@cssshiftscheduler.org'
  ) THEN
    INSERT INTO volunteers (
      auth_user_id,
      email,
      first_name,
      last_initial,
      role,
      phone,
      is_admin,
      is_active
    ) VALUES (
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'admin@cssshiftscheduler.org',
      'Admin',
      'A',
      'TL',
      '555-0123',
      true,
      true
    );
  END IF;
END $$;