-- =====================================================
-- CORREÇÃO DE POLÍTICAS RLS PERMISSIVAS
-- =====================================================

-- 1. ebook_captures: Remover política permissiva e restringir a admins
DROP POLICY IF EXISTS "Authenticated users can view ebook captures" ON public.ebook_captures;

CREATE POLICY "Admins can view ebook captures"
ON public.ebook_captures
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 2. email_unsubscribes: Remover política permissiva e restringir a admins
DROP POLICY IF EXISTS "Authenticated users can view unsubscribes" ON public.email_unsubscribes;

CREATE POLICY "Admins can view unsubscribes"
ON public.email_unsubscribes
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 3. lead_tags: Remover política permissiva duplicada
-- A política "Users can view tags for their leads" já existe e é correta
DROP POLICY IF EXISTS "Authenticated users can view lead tags" ON public.lead_tags;

-- 4. progress_reports: Restringir INSERT/UPDATE a service_role
DROP POLICY IF EXISTS "System can insert reports" ON public.progress_reports;
DROP POLICY IF EXISTS "System can update reports" ON public.progress_reports;

-- Não podemos criar políticas para service_role diretamente no RLS
-- pois service_role bypassa RLS automaticamente.
-- Então vamos apenas remover as políticas permissivas que usavam "true"
-- O service_role continuará funcionando normalmente pois bypassa RLS.

-- 5. scheduled_campaign_emails: Verificar se está restrita ao usuário
-- Se tiver política com "true" para authenticated, precisa restringir
DROP POLICY IF EXISTS "Authenticated users can manage scheduled emails" ON public.scheduled_campaign_emails;