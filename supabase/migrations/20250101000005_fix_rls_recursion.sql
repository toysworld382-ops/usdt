/*
# [CRITICAL] Full RLS Policy Reset for `profiles` and `exchange_rates`
[This script performs a complete reset of the Row Level Security (RLS) policies for the `profiles` and `exchange_rates` tables to resolve a persistent "infinite recursion" error. It establishes a secure and non-recursive pattern for data access.]

## Query Description: [This operation will drop all existing policies on the `profiles` and `exchange_rates` tables and create new, safe ones. This is a critical fix for the database instability. No data will be lost, but access rules will be reset. This is necessary to make the application functional.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["High"]
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Tables affected: `public.profiles`, `public.exchange_rates`
- Policies affected: ALL policies on these tables will be dropped and recreated.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This is the primary purpose of the script.
- Auth Requirements: Policies are based on `auth.uid()`.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: [Low. This is a metadata change and should be very fast.]
*/

-- STEP 1: Aggressively reset RLS policies on the 'profiles' table.
-- First, drop all existing policies to ensure a clean slate.
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for admins" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;

-- Re-enable RLS in case it was disabled. This ensures policies are active.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- STEP 2: Create a secure function to check if the current user is an admin.
-- SECURITY DEFINER is CRITICAL here to prevent recursion. It runs the function with the permissions of the function owner.
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- STEP 3: Create new, non-recursive policies for the 'profiles' table.

-- Policy 1: Users can see and update their OWN profile.
CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 2: Admins can see ALL profiles. This uses the secure function.
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_app_admin());


-- STEP 4: Ensure the 'exchange_rates' table is publicly readable.
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to exchange rates" ON public.exchange_rates;
CREATE POLICY "Allow public read access to exchange rates"
ON public.exchange_rates FOR SELECT
TO public
USING (is_active = true);
