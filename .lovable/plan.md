

# Plano: Sincronizar Reuniões de 24/02, Gerar Resumos e Enviar WhatsApp

## Bug Encontrado

A correção anterior de matching por nome tem um bug com a Sandra. O `full_name` dela é:

```text
"Sandra Mendes - Sociedade Individual de Advocacia"
```

O código extrai `firstName = "sandra"` e `lastName = "advocacia"` (última palavra). Quando o título do evento é "Consultoria e Mentoria Individual IDEA (Sandra Paula de Souza Mendes)", o sistema procura "advocacia" no título e não encontra → **reunião da Sandra não é sincronizada**.

O mesmo problema pode afetar qualquer cliente cujo `full_name` inclua razão social ou texto extra após o nome real.

## Correções

### 1. Melhorar matching de nome em `sync-calendar-sessions/index.ts` (linhas 219-224)

Em vez de usar apenas primeiro/último nome, usar a mesma lógica robusta de `sync-meet-recordings` — contar quantas partes significativas do nome aparecem no título (mínimo 2):

```typescript
// Extrair partes significativas do nome (ignorar preposições)
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const significantParts = consultingClient.full_name.trim().split(/\s+/)
  .map(p => normalize(p))
  .filter(p => p.length > 2 && !['de','da','do','dos','das','sociedade','individual','advocacia'].includes(p));
const matchCount = significantParts.filter(p => normalize(title).includes(p)).length;
const titleContainsClientName = matchCount >= 2;
```

Isso fará "Sandra" + "Mendes" = 2 matches → aceito.

### 2. SQL: Criar sessão faltante da Sandra em 24/02

Verificar se o Google Calendar tem uma reunião com Sandra em 24/02 e criar a sessão manualmente, já que a sync anterior a ignorou.

### 3. Sincronizar gravações e gerar resumos

Após corrigir o filtro e criar a sessão da Sandra:
- Chamar `sync-meet-recordings` para vincular as gravações do Drive às 5 sessões de 24/02
- Chamar `transcribe-recording` para cada sessão que tenha gravação vinculada → transcrição + resumo + envio WhatsApp automático

O fluxo existente já faz: Transcrição → Resumo IA → Envio WhatsApp automático (com verificação de `client_id`).

### 4. Verificação antes do envio WhatsApp

O sistema já verifica que o `client_id` está preenchido antes de enviar. A correção do filtro garante que cada sessão está atribuída ao cliente correto. Adicionalmente, os resumos só são enviados quando o `client_id` da sessão corresponde ao cliente cujo telefone será usado.

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `supabase/functions/sync-calendar-sessions/index.ts` | Melhorar matching de nome para ignorar razão social e usar 2+ partes significativas |
| SQL migration | Criar sessão da Sandra em 24/02 (se confirmada no Calendar) |

## Fluxo pós-deploy

1. Deploy da correção do filtro
2. Criar sessão da Sandra em 24/02
3. O usuário clica "Sincronizar Gravações" → vincula MP4s do Drive
4. O usuário clica "Transcrever" em cada sessão → transcrição + resumo + WhatsApp automático

## Detalhe técnico

A lógica de matching será alinhada entre `sync-calendar-sessions` e `sync-meet-recordings`, ambos usando a mesma estratégia de "2 partes significativas" com lista de stop-words (de, da, do, sociedade, individual, advocacia).

