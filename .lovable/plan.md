

# Plano de Correção de Segurança: Políticas RLS da tabela `consulting_clients`

## Diagnóstico do Problema

Após análise detalhada, identifiquei uma vulnerabilidade nas políticas RLS da tabela `consulting_clients`:

### Problema Identificado

As políticas de SELECT atuais são:

```text
1. "Consultants can view their own clients"
   USING: auth.uid() = user_id
   
2. "Clients can view own consulting record"  
   USING: email = auth.email() OR EXISTS(
     SELECT 1 FROM client_profiles cp 
     WHERE cp.user_id = auth.uid() 
     AND cp.consultant_id = consulting_clients.user_id
   )
```

**Problema**: A segunda condição `cp.consultant_id = consulting_clients.user_id` permite que um cliente veja **todos os registros do seu consultor** (não apenas o seu próprio), pois verifica apenas se o usuário é cliente daquele consultor, não se o registro específico pertence a ele.

### Impacto

Um cliente mal-intencionado poderia fazer uma requisição direta à API REST do Supabase com `limit=1000` e obter todos os clientes do consultor ao qual está vinculado.

---

## Solução Proposta

### Correção da Política RLS

Modificar a política "Clients can view own consulting record" para ser mais restritiva:

```sql
-- Remover política atual permissiva demais
DROP POLICY IF EXISTS "Clients can view own consulting record" 
  ON public.consulting_clients;

-- Nova política: cliente só vê o registro que corresponde ao seu próprio email
CREATE POLICY "Clients can view own consulting record"
  ON public.consulting_clients
  FOR SELECT
  TO authenticated
  USING (
    -- O registro deve pertencer ao consultor do cliente E ter o mesmo email
    EXISTS (
      SELECT 1 FROM client_profiles cp 
      WHERE cp.user_id = auth.uid() 
      AND cp.consultant_id = consulting_clients.user_id
      AND (
        -- O email do consulting_clients deve corresponder ao email do client_profiles
        lower(consulting_clients.email) = lower(cp.email)
        -- OU ao email de autenticação do usuário
        OR lower(consulting_clients.email) = lower(auth.email())
      )
    )
  );
```

Esta correção garante que:
1. O cliente só vê registros do seu consultor (`cp.consultant_id = consulting_clients.user_id`)
2. **E** o email do registro deve corresponder ao email do cliente (`consulting_clients.email = cp.email` ou `= auth.email()`)

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Nova migration SQL | Corrigir política RLS "Clients can view own consulting record" |

---

## Seção Técnica

### Migration SQL Completa

```sql
-- =====================================================
-- Correção de segurança: Política RLS consulting_clients
-- Impede que clientes vejam dados de outros clientes
-- =====================================================

-- 1. Remover política permissiva atual
DROP POLICY IF EXISTS "Clients can view own consulting record" 
  ON public.consulting_clients;

-- 2. Criar política corrigida (mais restritiva)
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

-- 3. Também corrigir as políticas de INSERT e UPDATE para consistência
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
```

---

## Impacto Esperado

Após a implementação:

- **Consultores**: Continuam vendo apenas seus próprios clientes (sem mudança)
- **Clientes**: Agora só podem ver/editar/inserir registros que correspondam ao **seu próprio email**
- **Segurança**: Mesmo manipulando parâmetros como `limit`, um cliente não poderá ver dados de outros clientes

---

## Testes Recomendados

1. Logar como consultor e verificar listagem de clientes
2. Logar como cliente e verificar que só vê seu próprio registro
3. Tentar fazer requisição direta à API com `limit=1000` como cliente e confirmar que retorna apenas 1 registro

