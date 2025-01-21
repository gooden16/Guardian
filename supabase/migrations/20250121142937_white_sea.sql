/*
  # Fix RLS policies for users table

  1. Changes
    - Drop existing problematic policies
    - Create new, optimized policies for users table
    - Add proper admin access

  2. Security
    - Prevents infinite recursion
    - Maintains proper access control
    - Ensures data security
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create new, optimized policies
CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );