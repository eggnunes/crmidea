-- Add policy to allow clients to create consulting_clients records for their consultant
-- This happens when a logged-in client fills out the diagnostic form

CREATE POLICY "Clients can create consulting_clients for their consultant" 
ON public.consulting_clients 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.client_profiles cp 
    WHERE cp.user_id = auth.uid() 
    AND cp.consultant_id = consulting_clients.user_id
  )
);