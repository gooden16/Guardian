/*
  # Initial Schema for CSS HIR Volunteer Portal

  1. New Tables
    - `users`
      - Core user information and role management
    - `shifts`
      - Shift scheduling and assignments
    - `shift_requests`
      - Handles shift swaps and coverage requests
    - `notifications`
      - System notifications and announcements
    - `shift_assignments`
      - Many-to-many relationship between users and shifts
    
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
*/

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'TEAM_LEADER', 'L1', 'L2')),
  phone_number text,
  is_active boolean DEFAULT true,
  quarterly_required integer NOT NULL DEFAULT 3,
  quarterly_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shifts Table
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  type text NOT NULL CHECK (type IN ('EARLY', 'LATE')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FILLED', 'IN_PROGRESS', 'COMPLETED')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shift Assignments Table
CREATE TABLE IF NOT EXISTS shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('TEAM_LEADER', 'L1', 'L2')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(shift_id, user_id)
);

-- Shift Requests Table
CREATE TABLE IF NOT EXISTS shift_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('SWAP', 'COVERAGE')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('SHIFT_REMINDER', 'SHIFT_CHANGE', 'ANNOUNCEMENT', 'REQUEST')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "All authenticated users can view shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage shifts"
  ON shifts
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Users can view their assignments"
  ON shift_assignments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Users can manage their requests"
  ON shift_requests
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Users can view their notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION check_shift_requirements()
RETURNS trigger AS $$
BEGIN
  -- Check if shift already has a team leader
  IF NEW.role = 'TEAM_LEADER' AND EXISTS (
    SELECT 1 FROM shift_assignments
    WHERE shift_id = NEW.shift_id AND role = 'TEAM_LEADER'
  ) THEN
    RAISE EXCEPTION 'Shift already has a team leader';
  END IF;

  -- Check if shift already has an L2
  IF NEW.role = 'L2' AND EXISTS (
    SELECT 1 FROM shift_assignments
    WHERE shift_id = NEW.shift_id AND role = 'L2'
  ) THEN
    RAISE EXCEPTION 'Shift already has an L2 volunteer';
  END IF;

  -- Check L1 limit (maximum 2)
  IF NEW.role = 'L1' AND (
    SELECT COUNT(*) FROM shift_assignments
    WHERE shift_id = NEW.shift_id AND role = 'L1'
  ) >= 2 THEN
    RAISE EXCEPTION 'Shift already has maximum number of L1 volunteers';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_shift_requirements
BEFORE INSERT ON shift_assignments
FOR EACH ROW
EXECUTE FUNCTION check_shift_requirements();