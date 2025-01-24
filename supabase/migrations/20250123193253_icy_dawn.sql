/*
  # Add role types and shift requirements
  
  1. Changes
    - Add role_type enum for user roles (TL, L1, L2)
    - Add role column to profiles table
    - Add role requirements columns to shifts table
    - Add role column to shift_assignments table
    - Update existing shifts with new requirements
*/

-- Create role type enum
DO $$ BEGIN
  CREATE TYPE role_type AS ENUM ('TL', 'L1', 'L2');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role role_type NOT NULL DEFAULT 'L1';

-- Add role requirements to shifts
ALTER TABLE shifts
ADD COLUMN IF NOT EXISTS required_tl integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS required_l1 integer NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS required_l2 integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS filled_tl integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS filled_l1 integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS filled_l2 integer NOT NULL DEFAULT 0,
ADD CONSTRAINT shifts_filled_tl_check CHECK (filled_tl <= required_tl),
ADD CONSTRAINT shifts_filled_l1_check CHECK (filled_l1 <= required_l1),
ADD CONSTRAINT shifts_filled_l2_check CHECK (filled_l2 <= required_l2);

-- Add role to shift assignments
ALTER TABLE shift_assignments
ADD COLUMN IF NOT EXISTS role role_type NOT NULL DEFAULT 'L1';

-- Update existing shifts with new requirements
UPDATE shifts
SET 
  required_tl = 1,
  required_l1 = 2,
  required_l2 = 1,
  total_slots = 4;  -- Update total slots to match requirements (1 TL + 2 L1 + 1 L2)

-- Function to update filled slots counts
CREATE OR REPLACE FUNCTION update_shift_role_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE shifts SET
      filled_slots = filled_slots + 1,
      filled_tl = filled_tl + (CASE WHEN NEW.role = 'TL' THEN 1 ELSE 0 END),
      filled_l1 = filled_l1 + (CASE WHEN NEW.role = 'L1' THEN 1 ELSE 0 END),
      filled_l2 = filled_l2 + (CASE WHEN NEW.role = 'L2' THEN 1 ELSE 0 END)
    WHERE id = NEW.shift_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE shifts SET
      filled_slots = filled_slots - 1,
      filled_tl = filled_tl - (CASE WHEN OLD.role = 'TL' THEN 1 ELSE 0 END),
      filled_l1 = filled_l1 - (CASE WHEN OLD.role = 'L1' THEN 1 ELSE 0 END),
      filled_l2 = filled_l2 - (CASE WHEN OLD.role = 'L2' THEN 1 ELSE 0 END)
    WHERE id = OLD.shift_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger for role counts
DROP TRIGGER IF EXISTS update_role_counts ON shift_assignments;
CREATE TRIGGER update_role_counts
  AFTER INSERT OR DELETE ON shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_shift_role_counts();

-- Update shift assignment policy to check role requirements
DROP POLICY IF EXISTS "Users can create their own assignments" ON shift_assignments;
CREATE POLICY "Users can create their own assignments"
  ON shift_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      SELECT (
        (role = 'TL' AND s.filled_tl < s.required_tl) OR
        (role = 'L1' AND s.filled_l1 < s.required_l1) OR
        (role = 'L2' AND s.filled_l2 < s.required_l2)
      )
      FROM shifts s
      WHERE s.id = shift_id
    )
  );
