/*
  # Create Shift Scheduler Schema

  1. New Tables
    - `shifts`
      - `id` (uuid, primary key)
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `total_slots` (integer)
      - `filled_slots` (integer)
      - `created_at` (timestamp)
    - `shift_assignments`
      - `id` (uuid, primary key)
      - `shift_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read all shifts
      - Read their own shift assignments
      - Create and delete their own shift assignments
*/

-- Create shifts table
CREATE TABLE shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  total_slots integer NOT NULL CHECK (total_slots > 0),
  filled_slots integer NOT NULL DEFAULT 0 CHECK (filled_slots >= 0),
  created_at timestamptz DEFAULT now(),
  CHECK (start_time < end_time),
  CHECK (filled_slots <= total_slots)
);

-- Create shift assignments table
CREATE TABLE shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(shift_id, user_id)
);

-- Enable RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for shifts table
CREATE POLICY "Anyone can read shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for shift assignments
CREATE POLICY "Users can read their assignments"
  ON shift_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assignments"
  ON shift_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      SELECT (s.filled_slots < s.total_slots)
      FROM shifts s
      WHERE s.id = shift_id
    )
  );

CREATE POLICY "Users can delete their own assignments"
  ON shift_assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update filled_slots count
CREATE OR REPLACE FUNCTION update_shift_filled_slots()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE shifts
    SET filled_slots = filled_slots + 1
    WHERE id = NEW.shift_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE shifts
    SET filled_slots = filled_slots - 1
    WHERE id = OLD.shift_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain filled_slots count
CREATE TRIGGER update_filled_slots
AFTER INSERT OR DELETE ON shift_assignments
FOR EACH ROW
EXECUTE FUNCTION update_shift_filled_slots();
