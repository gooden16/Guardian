/*
  # Fix admin user creation
  
  1. Changes
    - Handle existing email in both auth and public schemas
    - Update user if email exists
    - Ensure proper role assignment
*/

DO $$ 
DECLARE
  auth_uid uuid;
  existing_user_id uuid;
BEGIN 
  -- Check if user exists in public.users first
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = 'bweiss@gmail.com';

  IF existing_user_id IS NOT NULL THEN
    -- Update existing user
    UPDATE public.users
    SET 
      role = 'ADMIN',
      is_active = true,
      quarterly_required = 0,
      quarterly_completed = 0
    WHERE id = existing_user_id;
    
    -- Set auth_uid for potential auth.users update
    auth_uid := existing_user_id;
  ELSE
    -- Get auth user if exists
    SELECT id INTO auth_uid
    FROM auth.users
    WHERE email = 'bweiss@gmail.com';

    -- Create auth user if doesn't exist
    IF auth_uid IS NULL THEN
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
        crypt('AdminPass123!', gen_salt('bf')),
        NOW(),
        NOW(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('role', 'ADMIN'),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
      ) RETURNING id INTO auth_uid;

      -- Create public user with same id
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
        'ADMIN',
        true,
        0,
        0
      );
    END IF;
  END IF;
END $$;