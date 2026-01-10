
-- Fix the policy by removing unnecessary type casting
DROP POLICY IF EXISTS "Clients can view their own consulting data by email" ON public.consulting_clients;

CREATE POLICY "Clients can view their own consulting data by email" 
ON public.consulting_clients 
FOR SELECT 
USING (
  email IN (SELECT email FROM auth.users WHERE id = auth.uid())
);
