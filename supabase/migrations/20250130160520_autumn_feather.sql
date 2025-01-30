/*
  # Add shift messaging functionality

  1. New Tables
    - `shift_messages`
      - `id` (uuid, primary key)
      - `shift_id` (uuid, references shifts)
      - `user_id` (uuid, references profiles)
      - `message` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `shift_messages` table
    - Add policies for TL and admin access
*/

-- Create shift messages table
CREATE TABLE shift_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE shift_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view shift messages"
  ON shift_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Team Leaders and Admins can create messages"
  ON shift_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'TL' OR is_admin = true
      )
    )
  );

-- Create indexes
CREATE INDEX idx_shift_messages_shift_id ON shift_messages(shift_id);
CREATE INDEX idx_shift_messages_created_at ON shift_messages(created_at);