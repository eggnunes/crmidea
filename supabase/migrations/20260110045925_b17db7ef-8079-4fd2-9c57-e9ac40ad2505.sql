
-- Fix RLS policy to use auth.email() instead of querying auth.users directly
DROP POLICY IF EXISTS "Clients can view their own consulting data by email" ON public.consulting_clients;

CREATE POLICY "Clients can view their own consulting data by email" 
ON public.consulting_clients 
FOR SELECT 
USING (
  email = auth.email()
);

-- Fix client_progress_feedback RLS
DROP POLICY IF EXISTS "Clients can view own feedback via client email" ON public.client_progress_feedback;

CREATE POLICY "Clients can view own feedback via client email" 
ON public.client_progress_feedback 
FOR SELECT 
USING (
  client_id IN (
    SELECT cc.id FROM consulting_clients cc 
    WHERE cc.email = auth.email()
  )
);

-- Fix consulting_sessions RLS
DROP POLICY IF EXISTS "Clients can view their consulting sessions" ON public.consulting_sessions;

CREATE POLICY "Clients can view their consulting sessions" 
ON public.consulting_sessions 
FOR SELECT 
USING (
  client_id IN (
    SELECT cc.id FROM consulting_clients cc 
    WHERE cc.email = auth.email()
  )
);

-- Fix client_earned_badges RLS
DROP POLICY IF EXISTS "Clients can view own earned badges" ON public.client_earned_badges;

CREATE POLICY "Clients can view own earned badges" 
ON public.client_earned_badges 
FOR SELECT 
USING (
  client_id IN (
    SELECT cc.id FROM consulting_clients cc 
    WHERE cc.email = auth.email()
  )
  OR
  EXISTS (
    SELECT 1 FROM consulting_clients cc 
    WHERE cc.id = client_earned_badges.client_id AND cc.user_id = auth.uid()
  )
);

-- Fix diagnostic_form_progress RLS for clients - add policy to view their data
CREATE POLICY "Clients can view form progress by email" 
ON public.diagnostic_form_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM client_profiles cp
    WHERE cp.user_id = diagnostic_form_progress.client_user_id
    AND cp.email = auth.email()
  )
  OR client_user_id = auth.uid()
);
