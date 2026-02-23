

# Correção de Reuniões Incorretas nos Clientes de Consultoria

## Problema Identificado

A sincronização do Google Calendar (`sync-calendar-sessions`) usa uma busca muito ampla que associa eventos errados aos clientes. Exemplos encontrados:

| Cliente | Total | Corretas (estimadas) | Erradas |
|---------|-------|---------------------|---------|
| Luiz Augusto Nunes | 96 | ~1 | ~95 (82 sao "[Egg Nunes] Reuniao Semanal") |
| Ana Cristina | 18 | ~7 | ~11 |
| Diego Castro | 15 | ~8 | ~7 ("Conciliacao Jesp", "Melissa de Castro", etc.) |
| Lucineia | 14 | ~2 | ~12 ("Reuniao de Consultoria" genericas, "RD Station") |
| Adriana Gomes | 13 | ~3 | ~10 ("Marketing Meta", "Audiencia", etc.) |

**Causa raiz**: O sync busca eventos no calendario por nome/email e aceita qualquer evento que mencione o primeiro nome do cliente, gerando falsos positivos massivos.

---

## Solucao em 2 Etapas

### Etapa 1: Limpeza dos Dados Incorretos

Deletar todas as sessoes que NAO sao reunioes de consultoria legitimas. Criterios para MANTER uma sessao:

1. Titulo contem "Consultoria e Mentoria Individual IDEA" ou "Consultoria IDEA"
2. Titulo contem "Aula Mentoria [NomeCliente]" ou "Imersao [NomeCliente]" ou "Aula Imersao [NomeCliente]"
3. Sessao tem `ai_summary` preenchido (indica que foi processada como reuniao real)
4. Sessao tem `transcription` preenchida

Tudo que nao se enquadra nos criterios acima sera deletado. Isso inclui:
- "[Egg Nunes] Reuniao Semanal" (reunioes internas)
- "Reuniao de Consultoria" genericas sem evidencia de vinculo
- "Ligacao com Especialista em Marketing Meta"
- "Audiencia Inicial", "AIJ", "Conciliacao Jesp" (audiencias judiciais do cliente)
- "RD Station [Call X]"
- Eventos de outros clientes/pessoas

A limpeza sera feita via SQL direto, identificando por padrao de titulo e ausencia de dados de transcricao/resumo.

### Etapa 2: Correcao do Algoritmo de Sync

Alterar o `sync-calendar-sessions` para ser muito mais restritivo:

**Regras novas de matching:**

1. **Busca primaria por email**: Manter a busca por email do cliente, MAS so aceitar eventos onde:
   - O cliente esta EXPLICITAMENTE na lista de `attendees` do evento, OU
   - O titulo do evento contem um padrao de consultoria ("IDEA", "Consultoria", "Mentoria")

2. **Eliminar busca por nome (fallback)**: Remover completamente o bloco de fallback que busca por primeiro nome/sobrenome. Este e o principal causador de falsos positivos.

3. **Filtro de titulo obrigatorio**: Mesmo quando o email e encontrado nos attendees, exigir que o titulo do evento contenha pelo menos um dos termos: "IDEA", "Consultoria", "Mentoria", "Imersao", ou o nome/alias do cliente.

4. **Ignorar eventos internos**: Rejeitar eventos com "[Egg Nunes]" no titulo.

---

## Detalhes Tecnicos

### Arquivo: `supabase/functions/sync-calendar-sessions/index.ts`

Modificacoes na funcao `syncClientCalendar`:

1. Apos buscar eventos por email (linha 150), adicionar filtro de titulo obrigatorio:
   - Aceitar apenas se titulo contem "IDEA" ou "Consultoria" ou "Mentoria" ou nome/alias do cliente
   - Rejeitar se titulo contem "[Egg Nunes]" ou "RD Station"

2. Remover completamente o bloco de fallback por nome (linhas ~200-260) que busca por primeiro nome, sobrenome e nome completo

3. Adicionar checagem de `meet_display_name` como criterio adicional de titulo (alem de email nos attendees)

### Limpeza de dados (via SQL)

Sera executado um script que:
1. Identifica todas as sessoes por cliente
2. Marca como "para manter" as que tem titulo com padrao de consultoria OU tem ai_summary/transcription
3. Deleta as restantes

Estimativa: ~120-130 sessoes serao removidas no total.

### Impacto

- Os clientes verao apenas as reunioes reais de consultoria
- Futuras sincronizacoes nao criarao mais sessoes falsas
- Sessoes com gravacoes/transcricoes serao preservadas
