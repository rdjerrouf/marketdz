-- Fix profile UPDATE RLS policy to include WITH CHECK clause
-- Issue: Policy had USING but no WITH CHECK, causing 42501 errors on UPDATE
-- Solution: Add WITH CHECK clause to allow updates when user owns the profile

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "Users can update their own profile" ON public.profiles IS
'Allows authenticated users to update their own profile. Checks auth.uid() matches profile id for both read and write.';
