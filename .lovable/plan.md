
## Diagnóstico Completo

### Problema 1: Sueli — Apenas 1 reunião registrada (faltam várias)

**Causa raiz:** A função `sync-calendar-sessions` busca reuniões num janela de apenas **30 dias para trás** (`now - 30 dias`). Todas as reuniões anteriores da Sueli (que provavelmente aconteceram antes de 21/01/2026) estão **fora dessa janela** e nunca são importadas. A função foi criada para sincronização contínua, não para importação histórica completa.

**Evidência no código (linha 78):**
```typescript
const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // apenas 30 dias atrás
```

A Sueli tem só 1 sessão no banco (criada em 05/02/2026), mas certamente teve reuniões antes disso.

---

### Problema 2: Victor Hugo, Alan, ANDRIELLY — Sessões duplicadas por dia

**Causa raiz:** A função `sync-calendar-sessions` roda diariamente (cron automático às 06:00). A verificação de duplicatas usa `title + session_date ± 1 minuto`, mas o problema é que **a segunda busca (por nome) não verifica duplicatas corretamente** — ela busca `maybeSingle()` sem filtrar por data, então sempre retorna nulo e insere novamente.

**Evidência nos dados:**
- ANDRIELLY tem sessões criadas em `2026-02-15`, `2026-02-17`, `2026-02-18`, `2026-02-19`, `2026-02-20` — **todas para a mesma data de reunião** (uma nova cópia a cada dia que o cron roda)
- Alan: mesma sessão de 29/01 tem cópias criadas em 17, 18, 19, 20 de fevereiro
- Victor Hugo: 5 cópias da reunião de 19/02

**Evidência no código (linha 204-210):**
```typescript
// Segunda busca — filtra só por título, SEM filtrar por data!
const { data: existingSession } = await supabase
  .from('consulting_sessions')
  .select('id')
  .eq('client_id', consultingClient.id)
  .eq('title', event.summary || 'Reunião')
  .maybeSingle(); // retorna uma, mas sem filtro de data é frágil
                  // quando há múltiplas sessões com mesmo título
```

Quando a segunda busca retorna `null` (porque há múltiplos registros com mesmo título), ela insere mais um. Ou quando a segunda busca não encontra nada, insere sem checar se já existe na primeira busca.

---

## Resumo Global de Impacto

| Cliente | Sessões totais | Duplicatas | Causa |
|---|---|---|---|
| Alan Farias | 13 (deveria ter ~3) | 10 | Cron diário criando novas cópias |
| ANDRIELLY | 12 (deveria ter ~2) | 10 | Cron diário criando novas cópias |
| Victor Hugo | 11 (deveria ter ~2) | 9 | Cron diário criando novas cópias |
| Ana Cristina | 9 (deveria ter ~4) | 5 | Cron diário |
| Sueli | 1 (faltam várias) | 0 | Janela de 30 dias |

---

## Plano de Correção

### Parte 1: Limpeza de Dados Duplicados

Executar SQL para remover os registros duplicados, preservando **apenas o melhor** de cada grupo (priorizando o que tem resumo > o que tem transcrição > o mais antigo):

**Lógica de deduplicação:**
- Agrupar por `client_id + session_date::date`
- Dentro de cada grupo, manter o que tem `ai_summary`, depois o que tem `transcription`, depois o que tem `recording_drive_id`, por fim o mais antigo (`created_at` menor)
- Deletar todos os outros do mesmo grupo

**SQL de limpeza (via ferramenta de insert/update):**
```sql
-- Identificar e deletar duplicatas, preservando o melhor registro
DELETE FROM consulting_sessions
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY client_id, session_date::date
        ORDER BY
          (ai_summary IS NOT NULL) DESC,
          (transcription IS NOT NULL) DESC,
          (recording_drive_id IS NOT NULL) DESC,
          created_at ASC
      ) as rn
    FROM consulting_sessions
  ) ranked
  WHERE rn > 1
);
```

### Parte 2: Corrigir `sync-calendar-sessions` para evitar re-duplicação

**Mudança na lógica de deduplicação:**

A segunda busca (por nome) precisa usar **filtro de data** igual à primeira:

```typescript
// ANTES (bugado):
const { data: existingSession } = await supabase
  .from('consulting_sessions')
  .select('id')
  .eq('client_id', consultingClient.id)
  .eq('title', event.summary || 'Reunião')
  .maybeSingle();

// DEPOIS (corrigido):
const { data: existingSessions } = await supabase
  .from('consulting_sessions')
  .select('id')
  .eq('client_id', consultingClient.id)
  .gte('session_date', new Date(new Date(eventStart).getTime() - 60 * 60 * 1000).toISOString())
  .lte('session_date', new Date(new Date(eventStart).getTime() + 60 * 60 * 1000).toISOString());

if (existingSessions && existingSessions.length > 0) continue;
```

Usar janela de **±1 hora** em vez de ±1 minuto, e checar por **data** em vez de título (reuniões com mesmo cliente no mesmo horário = mesma reunião, independente do título).

### Parte 3: Ampliar janela histórica para Sueli (e outros)

Ampliar a `pastDate` de 30 dias para **24 meses** para capturar todo o histórico:

```typescript
// ANTES:
const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

// DEPOIS:
const pastDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000); // 24 meses
```

Além disso, adicionar paginação (`pageToken`) para buscar mais de 100 eventos do Google Calendar — reuniões históricas podem exceder esse limite.

---

## Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/sync-calendar-sessions/index.ts` | Corrigir deduplicação (±1h por data, não por título), ampliar janela para 24 meses, adicionar paginação |
| SQL via banco | Limpeza dos duplicatas existentes (preservando o melhor de cada grupo) |

Após as correções:
- Victor Hugo, Alan, ANDRIELLY e Ana Cristina terão apenas as sessões reais (sem duplicatas)
- As sessões com resumo e transcrição serão preservadas
- Sueli terá todas as reuniões históricas importadas ao sincronizar novamente
- O cron diário não criará mais duplicatas

