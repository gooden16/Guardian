/*
  # Update Admin Policies

  1. Changes
    - Drop and recreate admin policies for shifts table
    - Update view policy for authenticated users
  
  2. Security
    - Granular admin policies for CRUD operations
    - Read access for all authenticated users
*/

DO $$ BEGIN
  -- Drop all existing policies first
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

-- Create granular admin policies with safe creation
DO $$ BEGIN
  CREATE POLICY "Administrators can view shifts v2"
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

DO $$ BEGIN
  CREATE POLICY "Administrators can insert shifts v2"
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

DO $$ BEGIN
  CREATE POLICY "Administrators can update shifts v2"
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

DO $$ BEGIN
  CREATE POLICY "Administrators can delete shifts v2"
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

DO $$ BEGIN
  CREATE POLICY "Authenticated users can view shifts v2"
    ON shifts
    FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;