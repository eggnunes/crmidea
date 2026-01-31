

# Plano de Revisão de Segurança: Edge Functions e Políticas RLS

## Resumo Executivo

Após análise detalhada das edge functions e políticas RLS do projeto, identifiquei problemas de segurança em **edge functions autenticadas que não validam a propriedade dos dados** e **políticas RLS com expressões `true` permissivas**.

---

## 1. Diagnóstico Atual

### 1.1 Edge Functions com Problemas de Segurança

As seguintes edge functions autenticadas (`verify_jwt = true`) acessam dados **sem validar que pertencem ao usuário logado**:

| Edge Function | Problema | Risco |
|---------------|----------|-------|
| `generate-chat-summary` | Acessa `whatsapp_messages` e `whatsapp_conversations` por `conversationId` sem verificar `user_id` | Alto - Usuário pode ver mensagens de outros |
| `generate-chat-transcription` | Mesmo problema do `generate-chat-summary` | Alto |
| `manychat-find-subscriber` | Acessa conversa por ID sem verificar proprietário | Alto |
| `meta-send-message` | Envia mensagens sem verificar se a conversa pertence ao usuário | Alto |
| `sync-manychat-leads` | Acessa leads sem filtrar por usuário no modo `sync_all` | Médio |

### 1.2 Políticas RLS Permissivas (usando `true`)

Políticas que permitem acesso irrestrito a dados sensíveis:

| Tabela | Política | Expressão | Risco |
|--------|----------|-----------|-------|
| `bio_link_clicks` | SELECT: Authenticated users | `true` | Baixo - dados públicos |
| `ebook_captures` | SELECT: Authenticated users | `true` | Médio - qualquer usuário vê todos os leads |
| `email_unsubscribes` | SELECT: Authenticated users | `true` | Médio |
| `lead_tags` | SELECT: Authenticated users | `true` | Médio - pode ver tags de outros |
| `progress_reports` | INSERT/UPDATE: System | `true` | Médio - inserção irrestrita |
| `scheduled_campaign_emails` | ALL: Service role | `true` | Médio |

### 1.3 Edge Functions Corretamente Implementadas (referência)

Estas já seguem boas práticas:

- `generate-implementation-plan` - Valida JWT + verifica `user_id` no cliente
- `process-training-document` - Valida JWT + verifica proprietário do documento
- `google-calendar-sync` - Valida JWT + usa `authenticatedUserId` em todas as queries
- `delete-consulting-client` - Valida JWT + verifica que cliente pertence ao consultor

---

## 2. Plano de Implementação

### Fase 1: Corrigir Edge Functions Críticas

#### 2.1 `generate-chat-summary` e `generate-chat-transcription`

Adicionar validação de propriedade da conversa:

```typescript
// Verificar JWT e obter user_id
const authHeader = req.headers.get('authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

const token = authHeader.replace('Bearer ', '');
const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
if (claimsError || !claimsData?.claims) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

const authenticatedUserId = claimsData.claims.sub as string;

// Verificar que a conversa pertence ao usuário
const { data: conversation, error } = await supabase
  .from("whatsapp_conversations")
  .select("*")
  .eq("id", conversationId)
  .eq("user_id", authenticatedUserId)  // ADICIONAR ESTA LINHA
  .single();

if (error || !conversation) {
  return new Response(JSON.stringify({ error: 'Conversa não encontrada' }), { status: 403 });
}
```

#### 2.2 `manychat-find-subscriber`

Adicionar validação similar para garantir que a conversa pertence ao usuário autenticado.

#### 2.3 `meta-send-message`

Adicionar verificação de JWT e validação de propriedade da conversa antes de enviar mensagens.

#### 2.4 `sync-manychat-leads`

Filtrar leads pelo `user_id` do usuário autenticado na query:

```typescript
const { data: leads } = await supabase
  .from('leads')
  .select('*')
  .eq('user_id', authenticatedUserId)  // ADICIONAR
  .not('phone', 'is', null);
```

---

### Fase 2: Corrigir Políticas RLS Permissivas

#### 2.5 Tabela `ebook_captures`

```sql
-- Remover política permissiva
DROP POLICY IF EXISTS "Authenticated users can view ebook captures" ON public.ebook_captures;

-- Apenas admins podem ver capturas
CREATE POLICY "Admins can view ebook captures"
ON public.ebook_captures
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
```

#### 2.6 Tabela `email_unsubscribes`

```sql
DROP POLICY IF EXISTS "Authenticated users can view unsubscribes" ON public.email_unsubscribes;

CREATE POLICY "Admins can view unsubscribes"
ON public.email_unsubscribes
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
```

#### 2.7 Tabela `lead_tags`

```sql
-- Remover política permissiva duplicada
DROP POLICY IF EXISTS "Authenticated users can view lead tags" ON public.lead_tags;
-- A política "Users can view tags for their leads" já existe e é correta
```

#### 2.8 Tabela `progress_reports`

```sql
-- Remover política permissiva de INSERT
DROP POLICY IF EXISTS "System can insert reports" ON public.progress_reports;
DROP POLICY IF EXISTS "System can update reports" ON public.progress_reports;

-- Apenas service role (edge functions) podem inserir
CREATE POLICY "Service role can insert reports"
ON public.progress_reports
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update reports"
ON public.progress_reports
FOR UPDATE
TO service_role
USING (true);
```

---

### Fase 3: Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-chat-summary/index.ts` | Adicionar validação JWT + user_id |
| `supabase/functions/generate-chat-transcription/index.ts` | Adicionar validação JWT + user_id |
| `supabase/functions/manychat-find-subscriber/index.ts` | Adicionar validação JWT + user_id |
| `supabase/functions/meta-send-message/index.ts` | Adicionar validação JWT + user_id |
| `supabase/functions/sync-manychat-leads/index.ts` | Filtrar por user_id autenticado |
| Nova migration SQL | Corrigir políticas RLS permissivas |

---

## 3. Seção Técnica Detalhada

### Padrão de Validação para Edge Functions

```typescript
// 1. Extrair e validar JWT
const authHeader = req.headers.get('authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const token = authHeader.replace('Bearer ', '');
const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

if (claimsError || !claimsData?.claims) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
}

const authenticatedUserId = claimsData.claims.sub as string;

// 2. Sempre filtrar queries pelo user_id autenticado
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', authenticatedUserId);  // SEMPRE incluir este filtro

// 3. Para recursos filhos, verificar a cadeia de propriedade
const { data: parentResource } = await supabase
  .from('parent_table')
  .select('id')
  .eq('id', childResourceParentId)
  .eq('user_id', authenticatedUserId)
  .single();

if (!parentResource) {
  return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
}
```

### Resumo da Migration SQL

```sql
-- Corrigir políticas RLS permissivas
-- 1. ebook_captures: restringir a admins
-- 2. email_unsubscribes: restringir a admins  
-- 3. lead_tags: remover política duplicada permissiva
-- 4. progress_reports: restringir INSERT/UPDATE a service_role
```

---

## 4. Ordem de Execução

1. **Atualizar edge functions** com validação de JWT e user_id
2. **Fazer deploy das edge functions** atualizadas
3. **Executar migration SQL** para corrigir políticas RLS
4. **Testar** todas as funcionalidades afetadas

---

## 5. Impacto Esperado

- Usuários só poderão acessar seus próprios dados via edge functions
- Políticas RLS impedirão vazamento de dados entre usuários
- Manutenção da funcionalidade existente para usuários legítimos

