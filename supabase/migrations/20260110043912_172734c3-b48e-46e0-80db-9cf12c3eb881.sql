-- Add policy to allow clients to view their own consulting_clients record by matching their email
CREATE POLICY "Clients can view their own consulting data by email" 
ON public.consulting_clients 
FOR SELECT 
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);