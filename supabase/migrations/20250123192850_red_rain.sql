/*
  # Authentication Setup

  1. Changes
    - Enable authentication features
    - Add auth schema extensions
    - Set up email authentication
    - Configure auth settings
*/

-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configure auth settings
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create auth policies
CREATE POLICY "Public users are viewable by everyone."
  ON auth.users FOR SELECT
  USING (true);

-- Add trigger for managing user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();