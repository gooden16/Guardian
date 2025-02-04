/*
  # Add shift withdrawal functionality

  1. Changes
    - Add shift_withdrawals table to track withdrawal history
    - Add withdrawal event type to activity feed
    - Create function to handle withdrawals and record activity

  2. Security
    - Enable RLS on shift_withdrawals table
    - Add policies for authenticated users
*/

-- Create shift withdrawals table
CREATE TABLE shift_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE shift_withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own withdrawals"
  ON shift_withdrawals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals"
  ON shift_withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle withdrawal and record activity
CREATE OR REPLACE FUNCTION withdraw_from_shift(
  p_shift_id UUID,
  p_reason TEXT
)
RETURNS void AS $$
DECLARE
  user_name TEXT;
  shift_info RECORD;
BEGIN
  -- Get user's name
  SELECT first_name || ' ' || last_name INTO user_name
  FROM profiles
  WHERE id = auth.uid();

  -- Get shift info
  SELECT date, type INTO shift_info
  FROM shifts
  WHERE id = p_shift_id;

  -- Create withdrawal record
  INSERT INTO shift_withdrawals (shift_id, user_id, reason)
  VALUES (p_shift_id, auth.uid(), p_reason);

  -- Remove from shift_volunteers
  DELETE FROM shift_volunteers
  WHERE shift_id = p_shift_id AND user_id = auth.uid();

  -- Record activity
  INSERT INTO activity_feed (actor_id, event_type, event_data)
  VALUES (
    auth.uid(),
    'shift_withdrawal',
    jsonb_build_object(
      'name', user_name,
      'shift_type', shift_info.type,
      'shift_date', shift_info.date,
      'reason', p_reason
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;