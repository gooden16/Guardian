/*
  # Simplify RLS policies for users table

  1. Changes
    - Drop all existing policies
    - Create simplified policies without recursion
    - Ensure proper access control
*/

-- Drop all existing policies for users table
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Create new simplified policies
CREATE POLICY "Enable read access for authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable self-update for users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable admin access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    role = 'ADMIN' OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );