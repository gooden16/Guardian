/*
  # Add withdrawal tracking and update filled slots calculation

  1. Changes
    - Add withdrawal_tracking table to store withdrawal history
    - Add withdrawal_reason column to shift_assignments
    - Update trigger function to maintain accurate filled slots count
    - Add indexes for better query performance

  2. Security
    - Enable RLS on withdrawal_tracking table
    - Add policies for authenticated users
*/

-- Create withdrawal tracking table
CREATE TABLE IF NOT EXISTS withdrawal_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role role_type NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add withdrawal_reason to shift_assignments
ALTER TABLE shift_assignments
ADD COLUMN IF NOT EXISTS withdrawal_reason text;

-- Enable RLS
ALTER TABLE withdrawal_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for withdrawal_tracking
CREATE POLICY "Users can read their own withdrawals"
  ON withdrawal_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawals"
  ON withdrawal_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS withdrawal_tracking_shift_id_idx ON withdrawal_tracking(shift_id);
CREATE INDEX IF NOT EXISTS withdrawal_tracking_user_id_idx ON withdrawal_tracking(user_id);

-- Update the trigger function to handle withdrawals
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
      WHERE shift_id = NEW.shift_id 
      AND user_id = NEW.user_id 
      AND withdrawal_reason IS NULL
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

    -- Calculate current counts of active assignments
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
    -- Record the withdrawal if there's a reason
    IF OLD.withdrawal_reason IS NOT NULL THEN
      INSERT INTO withdrawal_tracking (
        shift_id,
        user_id,
        role,
        reason
      ) VALUES (
        OLD.shift_id,
        OLD.user_id,
        OLD.role,
        OLD.withdrawal_reason
      );
    END IF;

    -- Calculate current counts excluding withdrawn assignments
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

-- Reset all counts to ensure consistency with active assignments
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