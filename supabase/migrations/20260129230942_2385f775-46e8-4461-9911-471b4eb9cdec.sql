-- Drop and recreate the INSERT policy for authenticated clients
-- The old policy checked client_profiles.email match, but clients might use a different email in the form
DROP POLICY IF EXISTS "Clients can create consulting_clients for their consultant" ON public.consulting_clients;

-- New policy: Allow authenticated users who have a client_profile to insert consulting_clients
-- for their consultant (user_id field = their consultant_id), regardless of which email they use in the form
CREATE POLICY "Clients can create consulting_clients for their consultant" 
ON public.consulting_clients 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_profiles cp 
    WHERE cp.user_id = auth.uid() 
    AND cp.consultant_id = consulting_clients.user_id
  )
);

-- Also update the UPDATE policy to allow clients to update any record belonging to their consultant
-- where the record email matches the form email they're submitting (not necessarily their login email)
DROP POLICY IF EXISTS "Clients can update own consulting record" ON public.consulting_clients;

CREATE POLICY "Clients can update own consulting record" 
ON public.consulting_clients 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM client_profiles cp 
    WHERE cp.user_id = auth.uid() 
    AND cp.consultant_id = consulting_clients.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_profiles cp 
    WHERE cp.user_id = auth.uid() 
    AND cp.consultant_id = consulting_clients.user_id
  )
);

-- Update SELECT policy to allow clients to see records for their consultant where:
-- 1. The record email matches their login email, OR
-- 2. The record email matches their client_profiles email
DROP POLICY IF EXISTS "Clients can view own consulting record" ON public.consulting_clients;

CREATE POLICY "Clients can view own consulting record" 
ON public.consulting_clients 
FOR SELECT 
TO authenticated
USING (
  -- Either the email matches their auth email
  email = auth.email()
  OR
  -- Or they have a client_profile for this consultant
  EXISTS (
    SELECT 1 FROM client_profiles cp 
    WHERE cp.user_id = auth.uid() 
    AND cp.consultant_id = consulting_clients.user_id
  )
);