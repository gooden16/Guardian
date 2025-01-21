/*
  # Create admin user

  1. Changes
    - Create admin user in auth.users table
    - Create corresponding user in public.users table
    - Ensure proper role and permissions

  2. Security
    - Sets up initial admin account
    - Uses secure password hashing
    - Links auth and public user records
*/

DO $$ 
DECLARE
  auth_uid uuid;
BEGIN 
  -- First check if the user already exists in auth.users
  SELECT id INTO auth_uid
  FROM auth.users
  WHERE email = 'bweiss@gmail.com';

  -- If user doesn't exist in auth.users, create them
  IF auth_uid IS NULL THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'bweiss@gmail.com',
      crypt('AdminPass123!', gen_salt('bf')), -- This sets the password
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO auth_uid;

    -- Now create the user in public.users table with the same UUID
    INSERT INTO public.users (
      id,
      email,
      first_name,
      last_name,
      role,
      is_active,
      quarterly_required,
      quarterly_completed
    ) VALUES (
      auth_uid,
      'bweiss@gmail.com',
      'Benjamin',
      'Weiss',
      'TEAM_LEADER',
      true,
      0,
      0
    );
  END IF;
END $$;