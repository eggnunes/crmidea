-- Fix permissive RLS policy for client_earned_badges
DROP POLICY IF EXISTS "System can insert earned badges" ON public.client_earned_badges;

-- Create proper insert policy - only consultants can award badges to their clients
CREATE POLICY "Consultants can award badges to their clients" ON public.client_earned_badges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM consulting_clients cc 
      WHERE cc.id = client_earned_badges.client_id 
      AND cc.user_id = auth.uid()
    )
  );