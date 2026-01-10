
-- Add policy for clients to view their own consulting sessions
CREATE POLICY "Clients can view their consulting sessions" 
ON public.consulting_sessions 
FOR SELECT 
USING (
  client_id IN (
    SELECT cc.id FROM consulting_clients cc 
    WHERE cc.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Ensure client_earned_badges policy is correct - add policy for clients to view by matching their email in consulting_clients
DROP POLICY IF EXISTS "Clients can view own earned badges" ON public.client_earned_badges;
CREATE POLICY "Clients can view own earned badges" 
ON public.client_earned_badges 
FOR SELECT 
USING (
  client_id IN (
    SELECT cc.id FROM consulting_clients cc 
    WHERE cc.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM consulting_clients cc 
    WHERE cc.id = client_earned_badges.client_id AND cc.user_id = auth.uid()
  )
);
