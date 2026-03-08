

# Plano: Corrigir Inatividade Falsa e Link de Agendamento

## Problemas Identificados

### Problema 1: Rodrigo Brito recebe emails de inatividade diariamente
**Evidencia**: O banco mostra 4 emails de inatividade enviados em dias consecutivos (22, 23, 24, 25/fev).
**Causa raiz**: A funcao `check-inactive-clients` em `client-monthly-report/index.ts` (linhas 193-210) calcula inatividade baseando-se **apenas na data da ultima sessao (reuniao) completada**. A ultima sessao completada do Rodrigo foi em 22/01/2026 (33 dias atras). O sistema **ignora completamente** se o cliente fez login, atualizou etapas ou acessou o dashboard.

Alem disso, o email e enviado **todos os dias** apos atingir 30 dias, sem nenhum cooldown entre envios. O Rodrigo recebeu 4 emails em 4 dias consecutivos.

### Problema 2: Link de agendamento nao funciona para clientes
**Causa raiz**: A tabela `consulting_settings` tem RLS que permite SELECT apenas quando `auth.uid() = user_id`. O `user_id` na tabela e o do consultor (`e850e3e3`). Quando o cliente Rodrigo (user_id `4dc32f2a`) tenta ler o `calendar_booking_url`, a query retorna vazio por causa da RLS. O componente `BookingTab` mostra "link nao configurado".

O URL correto ja esta salvo no banco: `https://calendar.app.google/1i61CqqTTJdwBV7a6`
O usuario quer atualizar para: `https://calendar.app.google/asVrCHJCHuYJRc5B8`

### Problema 3: Sessao incorreta atribuida ao Rodrigo Brito
A sessao `d149db95` (19/02/2026) tem titulo "Consultoria e Mentoria Individual IDEA (Rodrigo Martins)" mas esta atribuida ao Rodrigo Brito. Outro bug do matching por nome parcial.

## Correcoes

### 1. `supabase/functions/client-monthly-report/index.ts` — Corrigir logica de inatividade

**Mudanca principal (linhas 193-212)**: Em vez de considerar apenas a ultima sessao completada, verificar tambem:
- **Ultimo login do cliente** (via tabela `client_profiles.updated_at` ou uma nova coluna `last_active_at`)
- **Ultima atualizacao nas etapas de implementacao** (via `consulting_clients.updated_at`)
- **Usar o mais recente** entre: ultima sessao, ultimo login, ultima atualizacao

**Adicionar cooldown**: Verificar na tabela `sent_emails_log` se ja foi enviado um email de inatividade nos ultimos 7 dias para aquele cliente. Se sim, nao enviar novamente.

Logica proposta:
```
lastActivity = MAX(
  ultima_sessao_completada,
  consulting_clients.updated_at,
  client_profiles.updated_at
)

SE lastActivity < 30 dias atras E nenhum email de inatividade nos ultimos 7 dias:
  enviar email
SENAO:
  pular
```

### 2. SQL Migration — Adicionar coluna `last_active_at` em `client_profiles`

Criar coluna `last_active_at` na tabela `client_profiles` para rastrear quando o cliente fez login/acessou o dashboard. Inicializar com `updated_at` existente.

### 3. Frontend — Atualizar `last_active_at` ao acessar o dashboard

No componente do dashboard do cliente (`ClientDashboardPage.tsx`), adicionar um `useEffect` que faz `UPDATE client_profiles SET last_active_at = now()` quando o cliente acessa a pagina.

### 4. SQL Migration — RLS para `consulting_settings`

Adicionar uma nova policy SELECT que permite clientes lerem o `calendar_booking_url` do seu consultor:
```sql
CREATE POLICY "Clientes podem ver settings do seu consultor"
ON consulting_settings FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT consultant_id FROM client_profiles WHERE user_id = auth.uid()
  )
);
```

### 5. SQL Migration — Atualizar booking URL e limpar sessao incorreta

- Atualizar `consulting_settings.calendar_booking_url` para `https://calendar.app.google/asVrCHJCHuYJRc5B8`
- Deletar sessao `d149db95` (Rodrigo Martins atribuida incorretamente ao Rodrigo Brito)

## Arquivos modificados

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/client-monthly-report/index.ts` | Considerar login + updated_at como atividade; adicionar cooldown de 7 dias |
| SQL migration | Adicionar `last_active_at` em `client_profiles`; RLS para `consulting_settings`; atualizar booking URL; deletar sessao incorreta |
| `src/pages/ClientDashboardPage.tsx` | Atualizar `last_active_at` ao acessar |

## Detalhes tecnicos

A mudanca na funcao de inatividade:

```text
ANTES: lastActivity = ultima sessao completada (ignora logins e atualizacoes)
       cooldown = nenhum (envia todo dia)

DEPOIS: lastActivity = MAX(sessao, login, updated_at do consulting_clients)
        cooldown = 7 dias entre emails de inatividade
```

Isso resolve o caso do Rodrigo: ele acessa o dashboard e atualiza etapas, entao `last_active_at` e `consulting_clients.updated_at` (23/02) sao recentes, e o sistema nao o considerara inativo.

