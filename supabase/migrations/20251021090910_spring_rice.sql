/*
  # Fix Profile Creation Trigger

  This migration fixes the handle_new_user trigger function to properly create user profiles
  when new users sign up, with the correct permissions to bypass RLS policies.

  1. Security
    - Creates trigger function with SECURITY DEFINER to bypass RLS
    - Handles conflicts gracefully to prevent duplicate key errors
    - Sets proper search path for security

  2. Functionality  
    - Automatically creates profile when user signs up
    - Sets default role to 'mechanic'
    - Uses user's email and metadata for profile creation
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function with proper security context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'mechanic'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;