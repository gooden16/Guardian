-- Drop and recreate the trigger function with improved error handling
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
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Check if already signed up for this shift
    IF EXISTS (
      SELECT 1 FROM shift_assignments
      WHERE shift_id = NEW.shift_id AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Already signed up for this shift';
    END IF;

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
    IF NEW.role = 'TL' AND other_shift_type IN ('Early', 'Late') THEN
      -- Check if already signed up for any shift on this date
      IF EXISTS (
        SELECT 1 
        FROM shift_assignments sa
        JOIN shifts s ON s.id = sa.shift_id
        WHERE sa.user_id = NEW.user_id
        AND s.date = shift_date
        AND s.shift_type IN ('Early', 'Late')
      ) THEN
        RAISE EXCEPTION 'Already signed up for a shift on this date';
      END IF;

      -- Find the other shift for the same date
      SELECT s.id INTO other_shift_id
      FROM shifts s
      WHERE s.date = shift_date
      AND s.id != NEW.shift_id
      AND s.shift_type IN ('Early', 'Late');

      IF other_shift_id IS NOT NULL THEN
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
        VALUES (other_shift_id, NEW.user_id, NEW.role);
      END IF;
    END IF;

    -- Calculate current counts
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

    -- Check role quotas with specific messages
    IF (NEW.role = 'TL' AND current_filled_tl >= required_tl) THEN
      RAISE EXCEPTION 'No more TL slots available';
    ELSIF (NEW.role = 'L1' AND current_filled_l1 >= required_l1) THEN
      RAISE EXCEPTION 'No more L1 slots available';
    ELSIF (NEW.role = 'L2' AND current_filled_l2 >= required_l2) THEN
      RAISE EXCEPTION 'No more L2 slots available';
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
    -- Get shift type and date for TL withdrawals
    SELECT shift_type, date INTO other_shift_type, shift_date
    FROM shifts
    WHERE id = OLD.shift_id;

    -- For TL withdrawals from Early/Late shifts
    IF OLD.role = 'TL' AND other_shift_type IN ('Early', 'Late') THEN
      -- Find and delete the other assignment if it exists
      DELETE FROM shift_assignments
      WHERE user_id = OLD.user_id
      AND role = OLD.role
      AND shift_id IN (
        SELECT id FROM shifts
        WHERE date = shift_date
        AND id != OLD.shift_id
        AND shift_type IN ('Early', 'Late')
      );
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