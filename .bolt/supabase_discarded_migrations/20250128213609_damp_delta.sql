/*
  # Add Admin Role and Policies

  1. Changes
    - Add is_admin column to volunteers table
    - Create admin management policies for shifts
    - Update view policy for authenticated users
  
  2. Security
    - Only admins can manage shifts
    - All authenticated users can view shifts
*/

-- Add admin column safely
DO $$ BEGIN
  ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
END $$;

-- Drop existing policies safely
DO $$ BEGIN
  DROP POLICY IF EXISTS "Administrators can manage shifts" ON shifts;
  DROP POLICY IF EXISTS "Anyone can view shifts" ON shifts;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create admin management policy
DO $$ BEGIN
  CREATE POLICY "Administrators can manage shifts"
    ON shifts
    USING (
      EXISTS (
        SELECT 1 FROM volunteers
        WHERE auth_user_id = auth.uid()
        AND is_admin = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM volunteers
        WHERE auth_user_id = auth.uid()
        AND is_admin = true
      )
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Create view policy for authenticated users
DO $$ BEGIN
  CREATE POLICY "Anyone can view shifts"
    ON shifts
    FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;