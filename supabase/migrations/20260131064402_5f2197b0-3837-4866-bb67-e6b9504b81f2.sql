-- =====================================================
-- Correção de segurança: Política RLS consulting_clients
-- Impede que clientes vejam dados de outros clientes
-- =====================================================

-- 1. Remover política permissiva atual de SELECT
DROP POLICY IF EXISTS "Clients can view own consulting record" 
  ON public.consulting_clients;

-- 2. Criar política corrigida de SELECT (mais restritiva)
CREATE POLICY "Clients can view own consulting record"
  ON public.consulting_clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_profiles cp 
      WHERE cp.user_id = auth.uid() 
      AND cp.consultant_id = consulting_clients.user_id
      AND (
        lower(consulting_clients.email) = lower(cp.email)
        OR lower(consulting_clients.email) = lower(auth.email())
      )
    )
  );

-- 3. Corrigir política de INSERT para consistência
DROP POLICY IF EXISTS "Clients can create consulting_clients for their consultant" 
  ON public.consulting_clients;

CREATE POLICY "Clients can create consulting_clients for their consultant"
  ON public.consulting_clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_profiles cp
      WHERE cp.user_id = auth.uid()
      AND cp.consultant_id = consulting_clients.user_id
      AND (
        lower(consulting_clients.email) = lower(cp.email)
        OR lower(consulting_clients.email) = lower(auth.email())
      )
    )
  );

-- 4. Corrigir política de UPDATE para consistência
DROP POLICY IF EXISTS "Clients can update own consulting record" 
  ON public.consulting_clients;

CREATE POLICY "Clients can update own consulting record"
  ON public.consulting_clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_profiles cp
      WHERE cp.user_id = auth.uid()
      AND cp.consultant_id = consulting_clients.user_id
      AND (
        lower(consulting_clients.email) = lower(cp.email)
        OR lower(consulting_clients.email) = lower(auth.email())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_profiles cp
      WHERE cp.user_id = auth.uid()
      AND cp.consultant_id = consulting_clients.user_id
      AND (
        lower(consulting_clients.email) = lower(cp.email)
        OR lower(consulting_clients.email) = lower(auth.email())
      )
    )
  );