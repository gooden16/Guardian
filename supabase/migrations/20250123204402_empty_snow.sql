/*
  # Update role counts trigger

  1. Changes
    - Fix the trigger function to properly update role-specific counts
    - Add constraints to ensure role counts don't exceed requirements
    - Update existing trigger to use new function

  2. Security
    - No changes to RLS policies
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS update_role_counts ON shift_assignments;
DROP TRIGGER IF EXISTS update_filled_slots ON shift_assignments;

-- Update the trigger function to handle role-specific counts
CREATE OR REPLACE FUNCTION update_shift_role_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update the appropriate role count and total filled slots
    UPDATE shifts SET
      filled_slots = filled_slots + 1,
      filled_tl = CASE WHEN NEW.role = 'TL' THEN filled_tl + 1 ELSE filled_tl END,
      filled_l1 = CASE WHEN NEW.role = 'L1' THEN filled_l1 + 1 ELSE filled_l1 END,
      filled_l2 = CASE WHEN NEW.role = 'L2' THEN filled_l2 + 1 ELSE filled_l2 END
    WHERE id = NEW.shift_id;
    
    -- Verify the update didn't exceed limits
    IF NOT EXISTS (
      SELECT 1 FROM shifts 
      WHERE id = NEW.shift_id 
      AND filled_tl <= required_tl 
      AND filled_l1 <= required_l1 
      AND filled_l2 <= required_l2
    ) THEN
      RAISE EXCEPTION 'Role quota exceeded';
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE shifts SET
      filled_slots = filled_slots - 1,
      filled_tl = CASE WHEN OLD.role = 'TL' THEN filled_tl - 1 ELSE filled_tl END,
      filled_l1 = CASE WHEN OLD.role = 'L1' THEN filled_l1 - 1 ELSE filled_l1 END,
      filled_l2 = CASE WHEN OLD.role = 'L2' THEN filled_l2 - 1 ELSE filled_l2 END
    WHERE id = OLD.shift_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the new trigger
CREATE TRIGGER update_role_counts
  AFTER INSERT OR DELETE ON shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_shift_role_counts();

-- Add explicit constraints for role counts
ALTER TABLE shifts
ADD CONSTRAINT check_role_counts
CHECK (
  filled_tl <= required_tl AND
  filled_l1 <= required_l1 AND
  filled_l2 <= required_l2
);

-- Reset counts to ensure consistency
UPDATE shifts SET
  filled_tl = COALESCE((
    SELECT COUNT(*) 
    FROM shift_assignments 
    WHERE shift_assignments.shift_id = shifts.id 
    AND role = 'TL'
  ), 0),
  filled_l1 = COALESCE((
    SELECT COUNT(*) 
    FROM shift_assignments 
    WHERE shift_assignments.shift_id = shifts.id 
    AND role = 'L1'
  ), 0),
  filled_l2 = COALESCE((
    SELECT COUNT(*) 
    FROM shift_assignments 
    WHERE shift_assignments.shift_id = shifts.id 
    AND role = 'L2'
  ), 0),
  filled_slots = COALESCE((
    SELECT COUNT(*) 
    FROM shift_assignments 
    WHERE shift_assignments.shift_id = shifts.id
  ), 0);