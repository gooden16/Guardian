/*
  # Fix shift assignments role handling

  1. Changes
    - Add role column to shift_assignments if not exists
    - Update trigger function to handle role assignments properly
    - Reset counts to ensure consistency

  2. Security
    - Maintain existing RLS policies
*/

-- Add role column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE shift_assignments ADD COLUMN role role_type NOT NULL DEFAULT 'L1';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Update the trigger function to handle role assignments
CREATE OR REPLACE FUNCTION update_shift_role_counts()
RETURNS TRIGGER AS $$
DECLARE
  other_shift_id uuid;
  other_shift_type text;
  current_filled_tl int;
  current_filled_l1 int;
  current_filled_l2 int;
  required_tl int;
  required_l1 int;
  required_l2 int;
  shift_date date;
  user_role role_type;
BEGIN
  -- Get user's role from profiles
  SELECT role INTO user_role
  FROM profiles
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  IF TG_OP = 'INSERT' THEN
    -- Set the role from the user's profile
    NEW.role := user_role;

    -- Get shift requirements and date
    SELECT 
      s.required_tl, s.required_l1, s.required_l2,
      s.shift_type, s.date
    INTO 
      required_tl, required_l1, required_l2,
      other_shift_type, shift_date
    FROM shifts s
    WHERE s.id = NEW.shift_id;

    -- For TLs signing up for Early/Late shifts, check both shifts
    IF user_role = 'TL' AND other_shift_type IN ('Early', 'Late') THEN
      -- Find the other shift for the same date
      SELECT s.id INTO other_shift_id
      FROM shifts s
      WHERE s.date = shift_date
      AND s.id != NEW.shift_id
      AND s.shift_type IN ('Early', 'Late');

      IF other_shift_id IS NOT NULL THEN
        -- Check if already signed up for either shift
        IF EXISTS (
          SELECT 1 FROM shift_assignments
          WHERE user_id = NEW.user_id
          AND shift_id IN (NEW.shift_id, other_shift_id)
          AND withdrawal_reason IS NULL
        ) THEN
          RAISE EXCEPTION 'Already signed up for one of these shifts';
        END IF;

        -- Check TL quotas for both shifts
        IF EXISTS (
          SELECT 1 FROM shifts
          WHERE id IN (NEW.shift_id, other_shift_id)
          AND filled_tl >= required_tl
        ) THEN
          RAISE EXCEPTION 'No more TL slots available for one or both shifts';
        END IF;

        -- Insert the other assignment
        INSERT INTO shift_assignments (shift_id, user_id, role)
        VALUES (other_shift_id, NEW.user_id, user_role);
      END IF;
    ELSE
      -- Check if already signed up for this shift
      IF EXISTS (
        SELECT 1 FROM shift_assignments
        WHERE shift_id = NEW.shift_id 
        AND user_id = NEW.user_id 
        AND withdrawal_reason IS NULL
      ) THEN
        RAISE EXCEPTION 'Already signed up for this shift';
      END IF;
    END IF;

    -- Calculate current counts
    SELECT 
      COUNT(*) FILTER (WHERE role = 'TL' AND withdrawal_reason IS NULL),
      COUNT(*) FILTER (WHERE role = 'L1' AND withdrawal_reason IS NULL),
      COUNT(*) FILTER (WHERE role = 'L2' AND withdrawal_reason IS NULL)
    INTO 
      current_filled_tl,
      current_filled_l1,
      current_filled_l2
    FROM shift_assignments
    WHERE shift_id = NEW.shift_id;

    -- Check role quotas
    IF (user_role = 'TL' AND current_filled_tl >= required_tl) THEN
      RAISE EXCEPTION 'No more TL slots available';
    ELSIF (user_role = 'L1' AND current_filled_l1 >= required_l1) THEN
      RAISE EXCEPTION 'No more L1 slots available';
    ELSIF (user_role = 'L2' AND current_filled_l2 >= required_l2) THEN
      RAISE EXCEPTION 'No more L2 slots available';
    END IF;

    -- Update counts
    UPDATE shifts SET
      filled_slots = current_filled_tl + current_filled_l1 + current_filled_l2 + 1,
      filled_tl = current_filled_tl + CASE WHEN user_role = 'TL' THEN 1 ELSE 0 END,
      filled_l1 = current_filled_l1 + CASE WHEN user_role = 'L1' THEN 1 ELSE 0 END,
      filled_l2 = current_filled_l2 + CASE WHEN user_role = 'L2' THEN 1 ELSE 0 END
    WHERE id = NEW.shift_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get shift type for TL withdrawals
    SELECT shift_type INTO other_shift_type
    FROM shifts
    WHERE id = OLD.shift_id;

    -- For TL withdrawals from Early/Late shifts
    IF OLD.role = 'TL' AND other_shift_type IN ('Early', 'Late') THEN
      -- Find the other shift for the same date
      WITH current_shift AS (
        SELECT date FROM shifts WHERE id = OLD.shift_id
      )
      SELECT s.id INTO other_shift_id
      FROM shifts s, current_shift cs
      WHERE s.date = cs.date
      AND s.id != OLD.shift_id
      AND s.shift_type IN ('Early', 'Late');

      -- Delete the other assignment if it exists
      IF other_shift_id IS NOT NULL THEN
        DELETE FROM shift_assignments
        WHERE shift_id = other_shift_id
        AND user_id = OLD.user_id
        AND role = OLD.role;
      END IF;
    END IF;

    -- Calculate current counts excluding the deleted assignment
    SELECT 
      COUNT(*) FILTER (WHERE role = 'TL' AND withdrawal_reason IS NULL),
      COUNT(*) FILTER (WHERE role = 'L1' AND withdrawal_reason IS NULL),
      COUNT(*) FILTER (WHERE role = 'L2' AND withdrawal_reason IS NULL)
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
UPDATE shifts s SET
  filled_slots = COALESCE(counts.total, 0),
  filled_tl = COALESCE(counts.tl_count, 0),
  filled_l1 = COALESCE(counts.l1_count, 0),
  filled_l2 = COALESCE(counts.l2_count, 0)
FROM (
  SELECT 
    shift_id,
    COUNT(*) FILTER (WHERE withdrawal_reason IS NULL) as total,
    COUNT(*) FILTER (WHERE role = 'TL' AND withdrawal_reason IS NULL) as tl_count,
    COUNT(*) FILTER (WHERE role = 'L1' AND withdrawal_reason IS NULL) as l1_count,
    COUNT(*) FILTER (WHERE role = 'L2' AND withdrawal_reason IS NULL) as l2_count
  FROM shift_assignments
  GROUP BY shift_id
) counts
WHERE s.id = counts.shift_id;
