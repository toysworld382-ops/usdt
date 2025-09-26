/*
# [Fix] RLS Policy for Profiles Table
This migration script resolves an "infinite recursion" error by resetting and correcting the Row Level Security (RLS) policies on the `public.profiles` table. The previous policies were causing a circular dependency, leading to query failures.

## Query Description:
This operation will drop all existing policies on the `profiles` table and create new, secure ones.
1.  **SELECT Policy**: Allows users to view their own profile.
2.  **UPDATE Policy**: Allows users to update their own profile.
This ensures that user data remains private while fixing the critical recursion bug. There is no risk of data loss.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.profiles`
- Affected Policies: All existing policies on this table will be replaced.

## Security Implications:
- RLS Status: Remains enabled.
- Policy Changes: Yes. Policies are being replaced to enforce correct user-level access.
- Auth Requirements: Policies rely on `auth.uid()`.

## Performance Impact:
- Indexes: None.
- Triggers: None.
- Estimated Impact: Positive. Resolves a critical performance bottleneck (infinite recursion).
*/

-- Drop all potentially conflicting policies on the profiles table to ensure a clean state.
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;


-- Create a secure SELECT policy that allows users to read their own profile data.
CREATE POLICY "Allow authenticated users to read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a secure UPDATE policy that allows users to update their own profile data.
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on the table, as dropping all policies might disable it.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
