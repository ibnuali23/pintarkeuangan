
-- 1. Add INSERT policy for profiles (critical - blocks new user signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Add DELETE policy for users on profiles
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- 3. Add DELETE policy for admins on profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_admin());

-- 4. Add admin SELECT policy for budget_settings
CREATE POLICY "Admins can view all budget settings"
ON public.budget_settings
FOR SELECT
USING (public.is_admin());
