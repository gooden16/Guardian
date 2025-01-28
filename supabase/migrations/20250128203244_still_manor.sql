/*
  # Initial Schema for CSS Shift Scheduler

  1. New Tables
    - `volunteers`
      - Basic profile information
      - Role and status tracking
      - Contact details
    - `shifts`
      - Shift scheduling and details
      - Hebrew names and dates
    - `shift_assignments`
      - Links volunteers to shifts
      - Tracks assignment status
    - `swap_requests`
      - Manages shift swaps between volunteers

  2. Security
    - Enable RLS on all tables
    - Policies for volunteers to:
      - Read their own data
      - View available shifts
      - Sign up for shifts
    - Admin policies for full access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Volunteer roles enum
CREATE TYPE volunteer_role AS ENUM ('TL', 'L2', 'L1');

-- Shift type enum
CREATE TYPE shift_type AS ENUM ('EARLY', 'LATE');

-- Swap request status enum
CREATE TYPE swap_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- Volunteers table
CREATE TABLE volunteers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  last_initial text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  role volunteer_role NOT NULL,
  avatar_url text,
  is_active boolean DEFAULT true,
  preferred_shift_type shift_type[],
  preferred_days text[],
  quarterly_commitment_count integer DEFAULT 0,
  last_shift_date timestamptz,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id)
);

-- Shifts table
CREATE TABLE shifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  date date NOT NULL,
  shift_type shift_type NOT NULL,
  hebrew_name text NOT NULL,
  is_holiday boolean DEFAULT false,
  min_volunteers integer NOT NULL DEFAULT 2,
  ideal_volunteers integer NOT NULL DEFAULT 3,
  notes text,
  UNIQUE(date, shift_type)
);

-- Shift assignments table
CREATE TABLE shift_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
  volunteer_id uuid REFERENCES volunteers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'CONFIRMED',
  UNIQUE(shift_id, volunteer_id)
);

-- Swap requests table
CREATE TABLE swap_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  requester_assignment_id uuid REFERENCES shift_assignments(id) ON DELETE CASCADE,
  target_volunteer_id uuid REFERENCES volunteers(id),
  status swap_status DEFAULT 'PENDING',
  resolved_at timestamptz
);

-- Enable RLS
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;

-- Volunteer policies
CREATE POLICY "Volunteers can read their own data"
  ON volunteers
  FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Volunteers can update their own data"
  ON volunteers
  FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Shift policies
CREATE POLICY "Anyone can view shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (true);

-- Assignment policies
CREATE POLICY "Volunteers can view assignments"
  ON shift_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Volunteers can create their own assignments"
  ON shift_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    volunteer_id IN (
      SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
    )
  );

-- Swap request policies
CREATE POLICY "Volunteers can view their swap requests"
  ON swap_requests
  FOR SELECT
  TO authenticated
  USING (
    requester_assignment_id IN (
      SELECT sa.id FROM shift_assignments sa
      JOIN volunteers v ON v.id = sa.volunteer_id
      WHERE v.auth_user_id = auth.uid()
    )
    OR
    target_volunteer_id IN (
      SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_volunteers_updated_at
  BEFORE UPDATE ON volunteers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shift_assignments_shift_id ON shift_assignments(shift_id);
CREATE INDEX idx_shift_assignments_volunteer_id ON shift_assignments(volunteer_id);
CREATE INDEX idx_swap_requests_status ON swap_requests(status);