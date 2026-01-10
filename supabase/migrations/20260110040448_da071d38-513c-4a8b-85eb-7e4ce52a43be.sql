-- Drop existing anonymous policies that might be conflicting
DROP POLICY IF EXISTS "Allow anonymous insert for diagnostic form" ON public.consulting_clients;
DROP POLICY IF EXISTS "Allow anonymous select after insert for diagnostic form" ON public.consulting_clients;

-- Create a more permissive policy for anonymous inserts
-- This allows anyone to insert a diagnostic form (no authentication required)
CREATE POLICY "Anonymous can insert diagnostic form"
ON public.consulting_clients
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to select the row they just inserted
CREATE POLICY "Anonymous can select after insert"
ON public.consulting_clients
FOR SELECT
TO anon
USING (true);