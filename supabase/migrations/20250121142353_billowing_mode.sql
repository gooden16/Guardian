/*
  # Create admin user

  1. Changes
    - Insert admin user record for bweiss@gmail.com
    - Set as both ADMIN and TEAM_LEADER role
    - Set quarterly requirements
*/

-- Insert admin user if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE email = 'bweiss@gmail.com'
  ) THEN
    INSERT INTO users (
      email,
      first_name,
      last_name,
      role,
      is_active,
      quarterly_required,
      quarterly_completed
    ) VALUES (
      'bweiss@gmail.com',
      'Benjamin',
      'Weiss',
      'TEAM_LEADER',
      true,
      0, -- No quarterly requirements for admin
      0
    );
  END IF;
END $$;