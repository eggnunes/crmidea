-- Drop the overly permissive anonymous SELECT policy that exposes all consulting client data
DROP POLICY IF EXISTS "Anonymous can select after insert" ON public.consulting_clients;

-- Note: The anonymous INSERT policy is kept as it's needed for the diagnostic form submission
-- The INSERT will return the inserted record via .select() without needing a separate SELECT policy