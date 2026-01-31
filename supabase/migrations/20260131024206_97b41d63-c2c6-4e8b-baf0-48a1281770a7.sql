-- =====================================================
-- CORREÇÃO ADICIONAL DE POLÍTICAS RLS PERMISSIVAS
-- =====================================================

-- 1. calendar_availability: Corrigir UPDATE para validar corretamente
DROP POLICY IF EXISTS "Anyone can book available slots" ON public.calendar_availability;

-- Permitir que qualquer pessoa reserve um slot disponível 
-- mas garantir que só pode marcar is_booked = true (não pode desmarcar)
CREATE POLICY "Anyone can book available slots"
ON public.calendar_availability
FOR UPDATE
USING (is_booked = false)  -- Só pode atualizar slots disponíveis
WITH CHECK (is_booked = true);  -- E só para marcar como ocupado

-- 2. scheduled_campaign_emails: Remover política permissiva
-- Esta tabela é acessada apenas por edge functions (service_role que bypassa RLS)
-- Não precisa de políticas para usuários autenticados
DROP POLICY IF EXISTS "Service role full access" ON public.scheduled_campaign_emails;

-- A tabela ficará sem políticas para authenticated, apenas service_role (edge functions) pode acessar