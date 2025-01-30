/*
  # Add shifts and volunteers tables

  1. New Tables
    - `shifts`
      - `id` (uuid, primary key)
      - `date` (date)
      - `type` (shift_type enum)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `shift_volunteers`
      - `id` (uuid, primary key)
      - `shift_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for viewing and signing up for shifts
*/

-- Create shift type enum
CREATE TYPE shift_type AS ENUM ('early', 'late');

-- Create shifts table
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  type shift_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, type)
);

-- Create shift_volunteers table
CREATE TABLE shift_volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shift_id, user_id)
);

-- Enable RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_volunteers ENABLE ROW LEVEL SECURITY;

-- Shifts policies
CREATE POLICY "Anyone can view shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify shifts"
  ON shifts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Shift volunteers policies
CREATE POLICY "Users can view all shift volunteers"
  ON shift_volunteers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can sign up for shifts"
  ON shift_volunteers
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Check if shift is not full (max 4 volunteers per shift)
      SELECT COUNT(*) < 4
      FROM shift_volunteers sv
      WHERE sv.shift_id = shift_volunteers.shift_id
    )
  );

CREATE POLICY "Users can remove themselves from shifts"
  ON shift_volunteers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update shifts
CREATE OR REPLACE FUNCTION handle_shift_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shifts
CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION handle_shift_update();

-- Create indexes
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shift_volunteers_shift_id ON shift_volunteers(shift_id);
CREATE INDEX idx_shift_volunteers_user_id ON shift_volunteers(user_id);