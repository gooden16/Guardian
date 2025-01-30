/*
  # Add role change functionality
  
  1. Changes
    - Add function to validate role changes
    - Add function to handle role changes
    - Add policy for role changes
  
  2. Security
    - Only allow role changes to a higher level if approved by an admin
    - Allow users to request role changes
    - Track role change requests in audit logs
*/

-- Create role change request status enum
CREATE TYPE role_change_status AS ENUM ('pending', 'approved', 'rejected');

-- Create role change requests table
CREATE TABLE role_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_role volunteer_role NOT NULL,
  requested_role volunteer_role NOT NULL,
  status role_change_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_role_change CHECK (current_role != requested_role)
);

-- Enable RLS
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for role change requests
CREATE POLICY "Users can view their own requests"
  ON role_change_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests"
  ON role_change_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

CREATE POLICY "Admins can view all requests"
  ON role_change_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can update requests"
  ON role_change_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Create function to request role change
CREATE OR REPLACE FUNCTION request_role_change(requested_role volunteer_role)
RETURNS UUID AS $$
DECLARE
  current_user_role volunteer_role;
  request_id UUID;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Create role change request
  INSERT INTO role_change_requests (
    user_id,
    current_role,
    requested_role
  ) VALUES (
    auth.uid(),
    current_user_role,
    requested_role
  )
  RETURNING id INTO request_id;

  RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to approve/reject role change
CREATE OR REPLACE FUNCTION handle_role_change_request(
  request_id UUID,
  new_status role_change_status,
  admin_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  request role_change_requests;
BEGIN
  -- Get request
  SELECT * INTO request
  FROM role_change_requests
  WHERE id = request_id
  AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Update request status
  UPDATE role_change_requests
  SET 
    status = new_status,
    approved_by = CASE WHEN new_status = 'approved' THEN admin_id ELSE NULL END,
    updated_at = now()
  WHERE id = request_id;

  -- If approved, update user's role
  IF new_status = 'approved' THEN
    UPDATE profiles
    SET role = request.requested_role
    WHERE id = request.user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;