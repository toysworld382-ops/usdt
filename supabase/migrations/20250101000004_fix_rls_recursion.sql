/*
# [Fix] RLS Policy Infinite Recursion
This migration fixes an infinite recursion error caused by misconfigured Row Level Security (RLS) policies on the 'profiles' table. It also ensures that public data like exchange rates are accessible.

## Query Description: This operation will drop and recreate RLS policies on the 'profiles' and 'exchange_rates' tables. It replaces potentially recursive policies with safe, non-recursive ones. This is a safe operation and will not result in data loss. It is crucial for fixing the application's data fetching errors.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects RLS policies for: `public.profiles`, `public.exchange_rates`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. Policies are being replaced to prevent recursion and ensure correct data access.
- Auth Requirements: Policies correctly use `auth.uid()` for user-specific access.
*/

-- Drop potentially conflicting policies on profiles to ensure a clean state
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users for their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow all users to read profiles" ON public.profiles;

-- Create safe, non-recursive policies for the 'profiles' table
-- 1. Users can view their own profile.
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 2. Users can update their own profile.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- Drop potentially conflicting policies on exchange_rates
DROP POLICY IF EXISTS "Enable read access for all users" ON public.exchange_rates;

-- Create policy for the 'exchange_rates' table
-- 1. Anyone (including anonymous users) can read the exchange rates. This is public data needed for the calculator.
CREATE POLICY "Enable read access for all users"
ON public.exchange_rates FOR SELECT
USING (true);

-- Ensure RLS is enabled on the exchange_rates table
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
