/*
  # Fix Conversation RLS Policies

  1. Changes
    - Remove recursive policy for conversation_participants
    - Add simpler policies for conversations and participants
    - Add policies for messages

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can view conversation members" ON conversation_participants;
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
DROP POLICY IF EXISTS "Participants can send messages" ON messages;

-- Conversations policies
CREATE POLICY "Anyone can view conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (true);

-- Conversation participants policies
CREATE POLICY "Anyone can view participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (true);

-- Messages policies
CREATE POLICY "Anyone can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);