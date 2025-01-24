/*
  # Fix TL withdrawal counts

  1. Changes
    - Update trigger function to properly handle TL withdrawals for both Early and Late shifts
    - Add additional validation for TL assignments
    - Reset counts to ensure consistency

  2. Security
    - No changes to RLS policies
*/

-- Update the trigger function to handle TL withdrawals properly
CREATE OR REPLACE FUNCTION update_shift_role_counts()
RETURNS TRIGGER AS $$
DECLARE
  other_shift_id uuid;
  other_shift_type text;
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
    -- For TL withdrawals, handle both Early and Late shifts
    IF OLD.role = 'TL' THEN
      -- Get the shift type
      SELECT shift_type INTO other_shift_type
      FROM shifts
      WHERE id = OLD.shift_id;

      -- If it's Early or Late, find and update the other shift
      IF other_shift_type IN ('Early', 'Late') THEN
        -- Find the other shift for the same date
        SELECT s.id INTO other_shift_id
        FROM shifts s
        JOIN shifts current_shift ON current_shift.id = OLD.shift_id
        WHERE s.date = current_shift.date
        AND s.id != OLD.shift_id
        AND s.shift_type IN ('Early', 'Late');

        -- Delete the assignment for the other shift if it exists
        IF other_shift_id IS NOT NULL THEN
          DELETE FROM shift_assignments
          WHERE shift_id = other_shift_id
          AND user_id = (
            SELECT user_id FROM shift_assignments WHERE id = OLD.id
          );
        END IF;
      END IF;
    END IF;

    -- Update counts for the current shift
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
