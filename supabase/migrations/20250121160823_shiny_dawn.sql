/*
  # Final RLS policy simplification
  
  1. Changes
    - Drop all existing policies
    - Create absolute minimal policies without any recursion
    - Use direct role checks only
*/

-- Drop all existing policies for users table
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable self-update for users" ON users;
DROP POLICY IF EXISTS "Enable admin access" ON users;

-- Create new simplified policies
CREATE POLICY "Enable read access for all authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable self-update for users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Enable insert for admins"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'ADMIN'));

CREATE POLICY "Enable delete for admins"
  ON users
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'ADMIN'));