

# Plano: Corrigir Sessões Incorretas e Sincronizar Reuniões de 24/Fev

## Diagnóstico

### Problema 1: Sessões erradas na Sandra
As sessões "Aula Imersão Rafa Mendes" (23/10/2025) e "Aula mentoria Rafa Mendes" (23/09/2024) foram incorretamente atribuídas à Sandra Mendes. Esses eventos são de **outra pessoa** chamada "Rafa Mendes".

**Causa raiz** (linha 219-224 de `sync-calendar-sessions/index.ts`): O código aceita um evento se `hasClientEmail OR hasConsultingPattern`. Como "Aula Imersão" e "Aula mentoria" são padrões genéricos de consultoria (`CONSULTING_TITLE_PATTERNS`), o sistema criou as sessões para Sandra mesmo sem o e-mail dela nos participantes. Bastou o título conter um padrão genérico para passar no filtro.

### Problema 2: Sessão duplicada atribuída ao cliente errado
A sessão de 12/02/2026 da Sandra foi duplicada e uma cópia foi atribuída à cliente "Paula Souza Muniz" (client_id `264c923a`) — provavelmente por matching parcial de nome ("Souza").

### Problema 3: Reuniões de 24/02 não sincronizadas
Existem 4 sessões de 24/02 no banco (Victor Hugo, Alan, Jelres, Andrielly), mas seus status estão como "scheduled" em vez de "completed". A reunião da Sandra em 24/02 não existe no banco.

## Correções

### 1. Limpeza do banco de dados (SQL migration)
Deletar as 3 sessões incorretas:
- `9e9c1214` — "Aula Imersão Rafa Mendes" (errado, não é da Sandra)
- `18c64db0` — "Aula mentoria Rafa Mendes" (errado, não é da Sandra)
- `b9bbcd69` — Sessão duplicada da Sandra atribuída a Paula Souza Muniz

Atualizar status das 4 sessões de 24/02 para "completed" (reuniões já ocorreram).

### 2. Correção do filtro em `sync-calendar-sessions/index.ts`

**Alterar a lógica principal (linhas 214-224)**: Um padrão genérico de consultoria (`hasConsultingPattern`) **não é mais suficiente sozinho**. A nova lógica exige:

```
SE o e-mail do cliente está nos participantes → aceitar
SE o título contém o NOME do cliente (primeiro + último nome) → aceitar  
CASO CONTRÁRIO → rejeitar (mesmo que o título contenha "aula mentoria", "imersão", etc.)
```

Isso impede que eventos genéricos como "Aula Imersão Rafa Mendes" sejam atribuídos a Sandra Mendes só porque o título contém "Imersão".

A função `isConsultingTitle` será dividida em duas responsabilidades:
- `isRejectedTitle()` — rejeita eventos internos (`[Egg Nunes]`, `RD Station`)
- A verificação de consulting pattern será movida para o loop principal, onde será usada apenas em conjunto com `hasClientEmail`

### 3. Sincronização manual das reuniões de 24/02

Após o deploy da correção, o sistema precisará que o usuário clique em "Sincronizar Gravações" na interface para importar as reuniões de 24/02. A correção do filtro garantirá que cada reunião seja atribuída ao cliente correto.

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `supabase/functions/sync-calendar-sessions/index.ts` | Corrigir lógica de filtro para exigir e-mail do cliente OU nome no título |
| SQL migration | Deletar 3 sessões incorretas + atualizar status de 24/02 |

## Detalhes técnicos

A mudança principal na função `sync-calendar-sessions`:

```typescript
// ANTES (bug): aceita se hasClientEmail OR hasConsultingPattern
// "Aula Imersão Rafa Mendes" → hasConsultingPattern=true → aceito para Sandra ❌

// DEPOIS (fix): aceita se hasClientEmail OR titleContainsClientName
// "Aula Imersão Rafa Mendes" → hasClientEmail=false, titleContainsClientName=false → rejeitado ✅
// "Consultoria IDEA (Sandra Mendes)" → titleContainsClientName=true → aceito ✅
```

A função `isConsultingTitle` continuará existindo mas será usada como **pré-filtro** (rejeitar eventos claramente irrelevantes), não como condição suficiente para aceitar.

