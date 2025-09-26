/*
# [Fix RLS Policies for Profiles Table]
This migration corrects the Row Level Security (RLS) policies for the `profiles` table to resolve an "infinite recursion" error. The previous `SELECT` policy was too permissive and likely causing conflicts. These new policies enforce that users can only access and modify their own profile data, which is a more secure and stable configuration.

## Query Description: [This operation will reset the security policies on the user profiles table. It replaces the existing policies with a stricter set to enhance security and fix a recursion bug. No data will be lost, but access rules will be more restrictive. Users will only be able to see their own profile.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table: `public.profiles`
- Affected Policies:
  - `Public profiles are viewable by everyone.` (DROPPED)
  - `Users can insert their own profile.` (REPLACED)
  - `Users can update own profile.` (REPLACED)
  - `Users can delete their own profile.` (REPLACED/ADDED)
  - `Users can view their own profile.` (CREATED)

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [All access to `profiles` now requires an authenticated user whose `id` matches the row's `id`.]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Low. Queries to `profiles` will be slightly more complex but are indexed by `id`.]
*/

-- Drop existing, potentially conflicting policies on the profiles table.
-- It's safe to run these even if the policies don't exist.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile." ON public.profiles;


-- Create a secure set of policies for the profiles table.

-- 1. Users can view their own profile.
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
USING ( auth.uid() = id );

-- 2. Users can insert their own profile.
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- 3. Users can update their own profile.
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 4. Users can delete their own profile.
CREATE POLICY "Users can delete their own profile."
ON public.profiles FOR DELETE
USING ( auth.uid() = id );
