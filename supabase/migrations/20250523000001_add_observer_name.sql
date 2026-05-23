-- Migration: Add observer_name to observations and create profiles table
-- Issue #133: Allow selecting an existing user or entering a freetext observer name

-- 1. Add observer_name column to observations table
ALTER TABLE observations
  ADD COLUMN IF NOT EXISTS "observerName" text;

-- 2. Create a public profiles table that mirrors basic auth.users data.
--    Each row is auto-created/updated by a trigger when a user signs up or updates their email.
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email      text,
  display_name text,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to read profiles for the observer picker
DROP POLICY IF EXISTS "profiles_read_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_all"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Back-fill profiles for any existing users
INSERT INTO profiles (id, email, display_name, updated_at)
  SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email),
    now()
  FROM auth.users
ON CONFLICT (id) DO NOTHING;
