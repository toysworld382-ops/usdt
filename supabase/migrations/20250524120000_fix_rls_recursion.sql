/*
# [CRITICAL] Final RLS Policy Reset for `profiles` and `exchange_rates`
This script performs a definitive reset of the Row Level Security (RLS) policies
for the `profiles` and `exchange_rates` tables to permanently fix the
"infinite recursion" error.

## Query Description:
This operation will:
1.  Aggressively remove ALL existing RLS policies from the `profiles` table. This is necessary to ensure no misconfigured policies remain.
2.  Create a new, simple, and non-recursive policy that allows users to read and update ONLY their own profile data.
3.  INTENTIONALLY omits a global "admin-can-see-all" policy on the `profiles` table for now. This is the source of the recursion, and it will be re-implemented safely in a future step. This may temporarily limit the user list in the admin panel, but it will make the main application stable.
4.  Adds a public read-all policy to the `exchange_rates` table to ensure it is accessible to everyone, which is required for the price calculator to work for logged-out users.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This is a corrective action to fix a critical security policy bug.
- Auth Requirements: Policies are based on `auth.uid()`.
*/

-- Step 1: Drop all conceivable RLS policies on the `profiles` table to ensure a clean slate.
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for admins" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;


-- Step 2: Re-create simple, non-recursive policies for the `profiles` table.
-- Users can view their own profile.
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- Step 3: Ensure the `exchange_rates` table is publicly readable.
-- This is required for the price calculator to function for all users.
DROP POLICY IF EXISTS "Enable read for all users" ON public.exchange_rates;
CREATE POLICY "Enable read for all users"
ON public.exchange_rates FOR SELECT
USING (true);

-- NOTE: A policy allowing admins to view all profiles is intentionally omitted
-- to prevent recursion. This will be added back safely in a later step.
