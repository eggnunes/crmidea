-- Allow consulting clients (end customers) to read their own consulting record
-- so they can see generated_prompt / implementation_plan / fragmented_prompts in the client dashboard.

ALTER TABLE public.consulting_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own consulting record"
ON public.consulting_clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.client_profiles cp
    WHERE cp.user_id = auth.uid()
      AND cp.consultant_id = consulting_clients.user_id
      AND lower(cp.email) = lower(consulting_clients.email)
  )
);
