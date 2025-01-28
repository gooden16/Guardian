/*
  # Add initial admin user

  1. Changes
    - Insert initial admin user into volunteers table
    
  2. Notes
    - Creates a default admin user that can be used to manage the system
    - Email and password should be changed after first login
*/

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