/*
          # [Operation Name] Restore Admin View on Profiles
          [This operation creates a secure function to check for admin privileges and re-enables the policy that allows admins to view all user profiles.]

          ## Query Description: [This script is safe and essential for restoring full admin panel functionality. It creates a function `is_claims_admin()` that checks a user's JWT for an 'is_admin' claim, preventing the previous database recursion error. It then adds an RLS policy allowing users who pass this check to read all rows from the 'profiles' table. This will fix the user list in the admin panel.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Creates function: `public.is_claims_admin()`
          - Creates policy: `Allow admins to view all profiles` on `public.profiles`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: This function relies on Supabase JWT claims.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. The function call is very efficient.
          */

-- 1. Create a function to securely check for the 'is_admin' claim from the JWT.
-- This avoids the recursive loop caused by checking the profiles table within its own policy.
create or replace function public.is_claims_admin()
returns boolean
language sql
stable
as $$
  select coalesce(get_claim(auth.uid(), 'is_admin')::bool, false)
$$;

-- 2. Grant execute permission to the authenticated role.
grant execute on function public.is_claims_admin() to authenticated;

-- 3. Create a new, safe policy for admins to view all profiles.
-- This policy uses the new function, which is not self-referential.
create policy "Allow admins to view all profiles"
on public.profiles for select
to authenticated
using ( public.is_claims_admin() );
