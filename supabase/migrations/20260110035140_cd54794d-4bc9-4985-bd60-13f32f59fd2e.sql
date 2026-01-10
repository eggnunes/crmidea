-- Add policy to allow anonymous users to insert diagnostic form submissions
-- This is needed because the PublicDiagnosticForm is filled by unauthenticated visitors
CREATE POLICY "Allow anonymous insert for diagnostic form"
ON public.consulting_clients
FOR INSERT
TO anon
WITH CHECK (true);

-- Also need to allow anon to select (for the .select().single() after insert)
CREATE POLICY "Allow anonymous select after insert for diagnostic form"
ON public.consulting_clients
FOR SELECT
TO anon
USING (true);