-- Drop all existing policies
DROP POLICY IF EXISTS "allow_read" ON users;
DROP POLICY IF EXISTS "allow_write" ON users;
DROP POLICY IF EXISTS "allow_update" ON users;

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
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Function to handle new user creation and updates
CREATE OR REPLACE FUNCTION handle_auth_user_change()
RETURNS trigger AS $$
BEGIN
  -- For new users
  IF (TG_OP = 'INSERT') THEN
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
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE((NEW.raw_user_meta_data->>'first_name'), split_part(NEW.email, '@', 1)),
      COALESCE((NEW.raw_user_meta_data->>'last_name'), ''),
      'L1',
      true,
      3,
      0
    )
    ON CONFLICT (email) DO UPDATE
    SET 
      id = EXCLUDED.id,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;

-- Create trigger for auth user changes
CREATE TRIGGER on_auth_user_change
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_change();

-- Ensure admin user exists
DO $$
BEGIN
  -- Create admin user if not exists
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
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    'bweiss@gmail.com',
    'Benjamin',
    'Weiss',
    'ADMIN',
    true,
    0,
    0
  )
  ON CONFLICT (email) DO UPDATE
  SET role = 'ADMIN', is_active = true;
END $$;