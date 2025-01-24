/*
  # Fix shift assignments trigger

  1. Changes
    - Improve trigger function to handle role assignments more reliably
    - Add better error handling for role quotas
    - Fix count calculations for both insert and delete operations

  2. Security
    - No changes to RLS policies
*/

-- Update the trigger function with improved error handling and count calculations
CREATE OR REPLACE FUNCTION update_shift_role_counts()
RETURNS TRIGGER AS $$
DECLARE
  other_shift_id uuid;
  other_shift_type text;
  current_filled_tl int;
  current_filled_l1 int;
  current_filled_l2 int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Calculate current counts excluding the new assignment
    SELECT 
      COUNT(*) FILTER (WHERE role = 'TL'),
      COUNT(*) FILTER (WHERE role = 'L1'),
      COUNT(*) FILTER (WHERE role = 'L2')
    INTO 
      current_filled_tl,
      current_filled_l1,
      current_filled_l2
    FROM shift_assignments
    WHERE shift_id = NEW.shift_id;

    -- Check role quotas before updating
    IF (NEW.role = 'TL' AND current_filled_tl >= (SELECT required_tl FROM shifts WHERE id = NEW.shift_id)) OR
       (NEW.role = 'L1' AND current_filled_l1 >= (SELECT required_l1 FROM shifts WHERE id = NEW.shift_id)) OR
       (NEW.role = 'L2' AND current_filled_l2 >= (SELECT required_l2 FROM shifts WHERE id = NEW.shift_id)) THEN
      RAISE EXCEPTION 'Role quota exceeded for %', NEW.role;
    END IF;

    -- Update counts
    UPDATE shifts SET
      filled_slots = current_filled_tl + current_filled_l1 + current_filled_l2 + 1,
      filled_tl = current_filled_tl + CASE WHEN NEW.role = 'TL' THEN 1 ELSE 0 END,
      filled_l1 = current_filled_l1 + CASE WHEN NEW.role = 'L1' THEN 1 ELSE 0 END,
      filled_l2 = current_filled_l2 + CASE WHEN NEW.role = 'L2' THEN 1 ELSE 0 END
    WHERE id = NEW.shift_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- For TL withdrawals, handle both Early and Late shifts
    IF OLD.role = 'TL' THEN
      SELECT shift_type INTO other_shift_type
      FROM shifts
      WHERE id = OLD.shift_id;

      IF other_shift_type IN ('Early', 'Late') THEN
        SELECT s.id INTO other_shift_id
        FROM shifts s
        JOIN shifts current_shift ON current_shift.id = OLD.shift_id
        WHERE s.date = current_shift.date
        AND s.id != OLD.shift_id
        AND s.shift_type IN ('Early', 'Late');

        IF other_shift_id IS NOT NULL THEN
          DELETE FROM shift_assignments
          WHERE shift_id = other_shift_id
          AND user_id = OLD.user_id;
        END IF;
      END IF;
    END IF;

    -- Calculate current counts excluding the deleted assignment
    SELECT 
      COUNT(*) FILTER (WHERE role = 'TL'),
      COUNT(*) FILTER (WHERE role = 'L1'),
      COUNT(*) FILTER (WHERE role = 'L2')
    INTO 
      current_filled_tl,
      current_filled_l1,
      current_filled_l2
    FROM shift_assignments
    WHERE shift_id = OLD.shift_id
    AND id != OLD.id;

    -- Update counts
    UPDATE shifts SET
      filled_slots = current_filled_tl + current_filled_l1 + current_filled_l2,
      filled_tl = current_filled_tl,
      filled_l1 = current_filled_l1,
      filled_l2 = current_filled_l2
    WHERE id = OLD.shift_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Reset all counts to ensure consistency
UPDATE shifts SET
  filled_slots = COALESCE((
    SELECT COUNT(*) 
    FROM shift_assignments 
    WHERE shift_assignments.shift_id = shifts.id
  ), 0),
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
  ), 0);
