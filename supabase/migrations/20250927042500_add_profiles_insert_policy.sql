/*
# [Fix] Add Missing INSERT Policy for Profiles Table
This migration adds the missing INSERT policy for the profiles table that allows the automatic profile creation trigger to work during user signup.

## Query Description:
This operation adds an INSERT policy to the profiles table that was accidentally omitted in previous RLS policy resets. The policy allows authenticated users to insert their own profile record, which is required for the create_profile_for_user() trigger to function properly during user registration.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: public.profiles
- Policy: "Users can insert their own profile" (INSERT)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes - Adds missing INSERT capability
- Auth Requirements: Requires authenticated users

## Performance Impact:
- Indexes: None
- Triggers: Fixes the profile creation trigger
- Estimated Impact: Positive - Resolves user registration failures
*/

-- Add the missing INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
