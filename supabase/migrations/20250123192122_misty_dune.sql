/*
  # Create shift scheduler schema

  1. New Tables
    - `shifts`
      - `id` (uuid, primary key)
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `total_slots` (integer)
      - `filled_slots` (integer)
      - `created_at` (timestamptz)
    - `shift_assignments`
      - `id` (uuid, primary key)
      - `shift_id` (uuid, references shifts)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Reading shifts (authenticated users)
      - Managing shift assignments (authenticated users)

  3. Triggers
    - Maintain filled_slots count automatically
*/

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS shifts (
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

  CREATE TABLE IF NOT EXISTS shift_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(shift_id, user_id)
  );
END $$;

-- Enable RLS
DO $$ BEGIN
  ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
END $$;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can read shifts" ON shifts;
  DROP POLICY IF EXISTS "Users can read their assignments" ON shift_assignments;
  DROP POLICY IF EXISTS "Users can create their own assignments" ON shift_assignments;
  DROP POLICY IF EXISTS "Users can delete their own assignments" ON shift_assignments;
END $$;

-- Create policies
CREATE POLICY "Anyone can read shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (true);

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

-- Create or replace trigger function
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

-- Drop and recreate trigger
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_filled_slots ON shift_assignments;
  CREATE TRIGGER update_filled_slots
    AFTER INSERT OR DELETE ON shift_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_shift_filled_slots();
END $$;