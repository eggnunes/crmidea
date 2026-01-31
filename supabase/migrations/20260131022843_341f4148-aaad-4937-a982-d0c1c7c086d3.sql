-- =====================================================
-- Restringir consulting_clients para usuários autenticados
-- =====================================================

-- Remover políticas antigas com acesso muito permissivo
DROP POLICY IF EXISTS "Anonymous can insert diagnostic form" ON public.consulting_clients;
DROP POLICY IF EXISTS "Clients can view their own consulting data by email" ON public.consulting_clients;
DROP POLICY IF EXISTS "Users can create their own consulting clients" ON public.consulting_clients;
DROP POLICY IF EXISTS "Users can delete their own consulting clients" ON public.consulting_clients;
DROP POLICY IF EXISTS "Users can update their own consulting clients" ON public.consulting_clients;
DROP POLICY IF EXISTS "Users can view their own consulting clients" ON public.consulting_clients;

-- =====================================================
-- POLÍTICAS PARA CONSULTORES (donos dos registros)
-- =====================================================

-- SELECT: Consultores podem ver seus próprios clientes
CREATE POLICY "Consultants can view their own clients"
ON public.consulting_clients
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Consultores podem criar clientes para si mesmos
CREATE POLICY "Consultants can insert their own clients"
ON public.consulting_clients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Consultores podem atualizar seus próprios clientes
CREATE POLICY "Consultants can update their own clients"
ON public.consulting_clients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Consultores podem excluir seus próprios clientes
CREATE POLICY "Consultants can delete their own clients"
ON public.consulting_clients
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- Nota: As políticas existentes para clientes permanecem:
-- - "Clients can view own consulting record"
-- - "Clients can create consulting_clients for their consultant"
-- - "Clients can update own consulting record"
-- Essas permitem que clientes acessem registros via client_profiles
-- =====================================================