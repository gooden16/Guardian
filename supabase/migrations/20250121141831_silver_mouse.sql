/*
  # Add volunteer availability tracking

  1. New Tables
    - `volunteer_availability`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `day_of_week` (integer, 0-6)
      - `start_time` (time)
      - `end_time` (time)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on volunteer_availability table
    - Add policies for users to manage their own availability
    - Add policy for admins to view all availability
*/

-- Create volunteer_availability table
CREATE TABLE IF NOT EXISTS volunteer_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_of_week, start_time, end_time)
);

-- Enable RLS
ALTER TABLE volunteer_availability ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own availability"
  ON volunteer_availability
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all availability"
  ON volunteer_availability
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Add Jewish holidays table
CREATE TABLE IF NOT EXISTS jewish_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE jewish_holidays ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view holidays
CREATE POLICY "All users can view holidays"
  ON jewish_holidays
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage holidays
CREATE POLICY "Admins can manage holidays"
  ON jewish_holidays
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Add incident reports table
CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Policies for incident reports
CREATE POLICY "Users can create incident reports"
  ON incident_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view incident reports for their shifts"
  ON incident_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shift_assignments sa
      WHERE sa.shift_id = incident_reports.shift_id
      AND sa.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Add volunteer stats view for leaderboard
CREATE OR REPLACE VIEW volunteer_stats AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.role,
  COUNT(sa.id) as total_shifts,
  COUNT(CASE WHEN s.date >= date_trunc('quarter', CURRENT_DATE) THEN 1 END) as quarterly_shifts,
  COUNT(CASE WHEN s.date >= date_trunc('year', CURRENT_DATE) THEN 1 END) as yearly_shifts
FROM users u
LEFT JOIN shift_assignments sa ON u.id = sa.user_id
LEFT JOIN shifts s ON sa.shift_id = s.id
GROUP BY u.id, u.first_name, u.last_name, u.role;

-- Grant access to the view
GRANT SELECT ON volunteer_stats TO authenticated;