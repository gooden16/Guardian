/*
  # Update shift messages table

  1. Changes
    - Add missing indexes if they don't exist
    - Add missing RLS policies if they don't exist
*/

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_shift_messages_shift_id'
  ) THEN
    CREATE INDEX idx_shift_messages_shift_id ON shift_messages(shift_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_shift_messages_created_at'
  ) THEN
    CREATE INDEX idx_shift_messages_created_at ON shift_messages(created_at);
  END IF;
END $$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view shift messages" ON shift_messages;
DROP POLICY IF EXISTS "Team Leaders and Admins can create messages" ON shift_messages;

-- Recreate policies
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