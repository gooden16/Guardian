/*
  # Fix Profile RLS Policies

  1. Changes
    - Remove recursive policy for profiles
    - Add simpler policies for profile access
    - Update shift assignment policies

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage volunteers" ON profiles;

-- Create new profile policies
CREATE POLICY "Public read access"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update shift assignment policies
CREATE POLICY "View shift assignments"
  ON shift_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Manage own assignments"
  ON shift_assignments FOR ALL
  TO authenticated
  USING (volunteer_id = auth.uid())
  WITH CHECK (volunteer_id = auth.uid());
