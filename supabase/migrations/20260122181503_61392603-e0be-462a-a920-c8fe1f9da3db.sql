-- Permitir que o próprio cliente atualize apenas o seu registro em consulting_clients (necessário para checklist/conclusão/URL do projeto)
-- A regra amarra: auth.uid() (cliente logado) -> client_profiles.user_id
-- e garante que o registro consultado/atualizado pertença a esse cliente via (email + consultant_id)

ALTER TABLE public.consulting_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can update own consulting record" ON public.consulting_clients;

CREATE POLICY "Clients can update own consulting record"
ON public.consulting_clients
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.client_profiles cp
    WHERE cp.user_id = auth.uid()
      AND cp.email = consulting_clients.email
      AND cp.consultant_id = consulting_clients.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.client_profiles cp
    WHERE cp.user_id = auth.uid()
      AND cp.email = consulting_clients.email
      AND cp.consultant_id = consulting_clients.user_id
  )
);
