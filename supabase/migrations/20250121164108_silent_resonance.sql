-- Drop all existing policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Create new simplified policies
CREATE POLICY "users_read_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_write_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create function to handle user ID synchronization
CREATE OR REPLACE FUNCTION sync_user_ids()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE email = NEW.email 
    AND id != NEW.id
  ) THEN
    UPDATE users 
    SET id = NEW.id 
    WHERE email = NEW.email;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user ID synchronization
DROP TRIGGER IF EXISTS sync_user_ids_trigger ON users;
CREATE TRIGGER sync_user_ids_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_ids();

-- Ensure admin user exists and has correct ID
DO $$ 
DECLARE
  admin_auth_id uuid;
BEGIN
  -- Get admin auth user ID
  SELECT id INTO admin_auth_id
  FROM auth.users
  WHERE email = 'bweiss@gmail.com'
  LIMIT 1;

  IF admin_auth_id IS NOT NULL THEN
    -- Update or insert admin user with correct ID
    UPDATE users
    SET 
      id = admin_auth_id,
      role = 'ADMIN',
      is_active = true
    WHERE email = 'bweiss@gmail.com';

    -- If no rows were updated, insert new admin user
    IF NOT FOUND THEN
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
      );
    END IF;
  END IF;
END $$;