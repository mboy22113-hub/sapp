-- ============================================================
-- 001_profiles.sql
-- ============================================================
--
-- WHAT THIS FILE DOES:
-- Creates the "profiles" table that stores app-specific user info.
-- Supabase Auth already manages login credentials (email, password).
-- This table adds: full name, role, department.
--
-- HOW IT CONNECTS TO AUTH:
-- The "id" column references auth.users(id).
-- When a user signs up via Supabase Auth, we create a matching
-- profile row (either manually or via a database trigger).
--
-- ROW LEVEL SECURITY (RLS):
-- - Users can read their own profile
-- - Users can update their own profile (but NOT their role)
-- - Service role (backend) can do everything
--
-- WHERE TO MODIFY LATER:
-- - Add columns like "phone_number", "avatar_url", "organization_id"
-- - Add more RLS policies if you need cross-user visibility
-- ============================================================

-- Enable UUID generation (needed for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a custom type for user roles
-- This ensures only valid roles can be stored in the database
CREATE TYPE public.user_role AS ENUM (
  'ADMIN',
  'INSPECTOR',
  'SAFETY_OFFICER',
  'RESPONSIBLE_PERSON'
);

-- Create the profiles table
CREATE TABLE public.profiles (
  -- Links to the Supabase Auth user. When the auth user is deleted,
  -- the profile is automatically deleted too (CASCADE).
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'INSPECTOR',
  department TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on role — speeds up queries like "find all inspectors"
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Turn on RLS (no one can access data without a matching policy)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Policy: Users can update their own profile (but role changes need admin)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admins can insert profiles (for user management)
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Policy: Allow new users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
-- This function automatically sets updated_at = now() whenever
-- a row is modified. We'll reuse this trigger on many tables.

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
