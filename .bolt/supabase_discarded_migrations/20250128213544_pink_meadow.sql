/*
  # Admin Policies for Shifts Management

  1. Changes
    - Drop existing policies for a clean slate
    - Create granular admin policies for CRUD operations
    - Add general read policy for authenticated users
  
  2. Security
    - Admins can perform all operations on shifts
    - Regular users can only view shifts
*/

DO $$ BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Administrators can manage shifts" ON shifts;
  DROP POLICY IF EXISTS "Anyone can view shifts" ON shifts;
  DROP POLICY IF EXISTS "Administrators can view shifts" ON shifts;
  DROP POLICY IF EXISTS "Administrators can insert shifts" ON shifts;
  DROP POLICY IF EXISTS "Administrators can update shifts" ON shifts;
  DROP POLICY IF EXISTS "Administrators can delete shifts" ON shifts;
  DROP POLICY IF EXISTS "Authenticated users can view shifts" ON shifts;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policy for admins to view shifts
DO $$ BEGIN
  CREATE POLICY "Administrators can view shifts"
    ON shifts
    FOR SELECT
    USING (
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

-- Create policy for admins to insert shifts
DO $$ BEGIN
  CREATE POLICY "Administrators can insert shifts"
    ON shifts
    FOR INSERT
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

-- Create policy for admins to update shifts
DO $$ BEGIN
  CREATE POLICY "Administrators can update shifts"
    ON shifts
    FOR UPDATE
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

-- Create policy for admins to delete shifts
DO $$ BEGIN
  CREATE POLICY "Administrators can delete shifts"
    ON shifts
    FOR DELETE
    USING (
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

-- Create policy for authenticated users to view shifts
DO $$ BEGIN
  CREATE POLICY "Authenticated users can view shifts"
    ON shifts
    FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;