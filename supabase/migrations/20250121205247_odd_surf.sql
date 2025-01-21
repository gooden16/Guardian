/*
  # Core Tables for CSS Guardian

  1. New Tables
    - `shifts`
      - `id` (uuid, primary key)
      - `date` (date)
      - `time` (text)
      - `notes` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `shift_assignments`
      - `id` (uuid, primary key)
      - `shift_id` (uuid, references shifts)
      - `volunteer_id` (uuid, references profiles)
      - `role` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `conversations`
      - `id` (uuid, primary key)
      - `type` (text)
      - `shift_id` (uuid, references shifts)
      - `name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `conversation_participants`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `volunteer_id` (uuid, references profiles)
      - `created_at` (timestamptz)

    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `sender_id` (uuid, references profiles)
      - `text` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Shifts table
CREATE TABLE shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time text NOT NULL,
  notes jsonb DEFAULT '{"admin": [], "teamLeader": []}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shift assignments table
CREATE TABLE shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts ON DELETE CASCADE,
  volunteer_id uuid REFERENCES profiles ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  shift_id uuid REFERENCES shifts ON DELETE CASCADE,
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversation participants table
CREATE TABLE conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations ON DELETE CASCADE,
  volunteer_id uuid REFERENCES profiles ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Shifts policies
CREATE POLICY "Anyone can view shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team leaders can update shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'team_leader'
  ));

-- Shift assignments policies
CREATE POLICY "Anyone can view shift assignments"
  ON shift_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Volunteers can manage their own assignments"
  ON shift_assignments FOR ALL
  TO authenticated
  USING (volunteer_id = auth.uid());

-- Conversations policies
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND volunteer_id = auth.uid()
    )
  );

-- Conversation participants policies
CREATE POLICY "Participants can view conversation members"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.volunteer_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND volunteer_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND volunteer_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- Update functions
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update triggers
CREATE TRIGGER update_shifts_timestamp
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_shift_assignments_timestamp
  BEFORE UPDATE ON shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_conversations_timestamp
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();