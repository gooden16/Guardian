/*
  # Add activity feed system
  
  1. New Tables
    - `activity_feed`
      - `id` (uuid, primary key)
      - `actor_id` (uuid, references profiles)
      - `event_type` (text)
      - `event_data` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on activity_feed table
    - Add policies for reading and creating activities
*/

-- Create activity feed table
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view activity feed"
  ON activity_feed
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to record signup event
CREATE OR REPLACE FUNCTION record_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (actor_id, event_type, event_data)
  VALUES (
    NEW.id,
    'user_signup',
    jsonb_build_object(
      'name', NEW.first_name || ' ' || NEW.last_name
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record shift signup
CREATE OR REPLACE FUNCTION record_shift_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  shift_info RECORD;
BEGIN
  -- Get user's name
  SELECT first_name || ' ' || last_name INTO user_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Get shift info
  SELECT date, type INTO shift_info
  FROM shifts
  WHERE id = NEW.shift_id;

  INSERT INTO activity_feed (actor_id, event_type, event_data)
  VALUES (
    NEW.user_id,
    'shift_signup',
    jsonb_build_object(
      'name', user_name,
      'shift_type', shift_info.type,
      'shift_date', shift_info.date
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_user_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION record_user_signup();

CREATE TRIGGER on_shift_signup
  AFTER INSERT ON shift_volunteers
  FOR EACH ROW
  EXECUTE FUNCTION record_shift_signup();

-- Create index for better performance
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);