
-- Fix client_progress_feedback RLS: clientes devem poder ver pelo client_id relacionado ao seu email
DROP POLICY IF EXISTS "Clients can view and insert own feedback via email" ON public.client_progress_feedback;

CREATE POLICY "Clients can view own feedback via client email" 
ON public.client_progress_feedback 
FOR SELECT 
USING (
  client_id IN (
    SELECT cc.id FROM consulting_clients cc 
    WHERE cc.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Fix consulting_sessions RLS: garantir que a política funcione corretamente
DROP POLICY IF EXISTS "Clients can view their consulting sessions" ON public.consulting_sessions;

CREATE POLICY "Clients can view their consulting sessions" 
ON public.consulting_sessions 
FOR SELECT 
USING (
  client_id IN (
    SELECT cc.id FROM consulting_clients cc 
    WHERE cc.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Fix client_earned_badges RLS: já existe mas vamos garantir que funcione
-- (já adicionada em migração anterior)

-- Garantir que diagnostic_form_progress tenha política correta para clientes
-- (a política atual usa client_user_id = auth.uid(), o que está correto)
