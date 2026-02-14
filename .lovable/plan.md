
# Plano: Corrigir Conexao Google Calendar + Melhorar Matching de Gravacoes

## Problemas Identificados

### 1. Redirect URI aponta para dominio errado
O codigo forca o redirecionamento para `crmidea.lovable.app`, mas o usuario acessa via `rafaelegg.com`. Apos autenticar no Google, o usuario e redirecionado para um dominio onde nao tem sessao ativa, e a troca do codigo OAuth falha.

### 2. Metodo `getClaims` nao existe
A funcao `google-calendar-auth` usa `supabase.auth.getClaims(token)` que nao e um metodo valido do Supabase. Deve usar `supabase.auth.getUser(token)`.

### 3. Matching de gravacoes impreciso
Quando ha multiplas reunioes no mesmo dia, o sistema nao consegue distinguir qual gravacao pertence a qual cliente (usa apenas a data).

## Correcoes

### Etapa 1 - Corrigir o redirect URI no frontend

**Arquivo:** `src/hooks/useGoogleCalendar.tsx`

Mudar a funcao `getRedirectUri()` para usar `rafaelegg.com` como dominio canonico (em vez de `crmidea.lovable.app`). Isso garante que:
- O Google redireciona para o dominio correto
- A sessao do usuario esta presente apos o redirecionamento
- A troca do codigo OAuth funciona

### Etapa 2 - Corrigir a autenticacao na Edge Function

**Arquivo:** `supabase/functions/google-calendar-auth/index.ts`

Substituir `supabase.auth.getClaims(token)` por `supabase.auth.getUser(token)`. Este e o metodo correto para validar o JWT e obter o ID do usuario.

### Etapa 3 - Melhorar matching de gravacoes

**Arquivo:** `supabase/functions/sync-meet-recordings/index.ts`

Atualmente, o matching e feito apenas por data. Melhorar para usar:
1. **Data + horario** - comparar a hora da gravacao com a hora da sessao (tolerancia de +/- 2 horas)
2. **Nome do cliente no titulo** - verificar se o nome do cliente aparece no nome do arquivo da gravacao
3. **Busca em subpastas** - alem da pasta "Meet Recordings", buscar tambem em pastas que contenham o nome do cliente

Quando ha multiplas reunioes no mesmo dia, o sistema vai:
- Primeiro tentar match por nome do cliente no titulo do arquivo
- Depois por proximidade de horario (a gravacao mais proxima da hora da sessao)
- So usar match generico por data se nao encontrar match mais especifico

### Etapa 4 - Buscar gravacoes em pastas personalizadas

**Arquivo:** `supabase/functions/sync-meet-recordings/index.ts`

Adicionar busca em pastas do Drive que contenham o nome do cliente. Isso permite encontrar gravacoes que voce moveu para pastas organizadas por cliente.

O sistema vai:
1. Buscar na pasta "Meet Recordings" (padrao do Google Meet)
2. Buscar em pastas cujo nome contenha o nome do cliente
3. Combinar os resultados e fazer o matching

## O que voce precisa fazer no Google Console

Apos a implementacao, voce precisara garantir que o redirect URI correto esta cadastrado no Google Cloud Console:

1. Acesse https://console.cloud.google.com
2. Va em "APIs e Servicos" > "Credenciais"
3. Clique na credencial OAuth do projeto
4. Em "URIs de redirecionamento autorizados", verifique se consta:
   `https://rafaelegg.com/metodo-idea/calendario?google_callback=true`
5. Se nao constar, adicione e salve

## Resumo das alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useGoogleCalendar.tsx` | Corrigir redirect URI para `rafaelegg.com` |
| `supabase/functions/google-calendar-auth/index.ts` | Trocar `getClaims` por `getUser` |
| `supabase/functions/sync-meet-recordings/index.ts` | Melhorar matching (horario + nome) e buscar em subpastas |

## Resultado esperado

1. Voce clica em "Conectar Google Calendar"
2. E redirecionado para o Google, autoriza o acesso (Calendar + Drive)
3. E redirecionado de volta para `rafaelegg.com/metodo-idea/calendario`
4. O sistema troca o codigo OAuth por tokens e salva no banco
5. Aparece "Conectado ao Google Calendar"
6. Ao clicar "Sincronizar Gravacoes", o sistema encontra a gravacao correta de cada cliente, mesmo com multiplas reunioes no mesmo dia
