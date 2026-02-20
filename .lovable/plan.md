
## Diagnóstico Completo

### O que está acontecendo

No dia 19/02/2026, você teve reuniões com três clientes em horários próximos:
- **Victor Hugo** — 17h
- **Lucineia** (Rodrigo Martins) — 18h  
- **Rodrigo Oliveira de Brito** — 18h

O problema está em duas partes do sistema:

**1. Source 1b no `batch-import-transcripts`** (linhas 347–356):
Este bloco pega gravações da pasta "Meet Recordings" usando **apenas a data** como critério — sem verificar se o nome do arquivo tem relação com o cliente. Com três clientes no mesmo dia, ele atribui a mesma gravação a múltiplos clientes, ou atribui a gravação errada.

**2. `sync-meet-recordings` — Priority 2 (nome no arquivo)**:
A gravação da Lucineia está salva no Drive com o nome "Rodrigo Martins" (o sócio dela que marcou a reunião). A função `fileMatchesClient` precisa de 2 partes do nome do cliente no arquivo — como o arquivo diz "Rodrigo Martins" e o cliente cadastrado é "Lucineia Cristina Martins Rodrigues", o match falha. Aí o sistema cai no Priority 3/4 (horário mais próximo ou único do dia) e associa a gravação errada.

### Solução para cada caso

**Caso Lucineia** (gravação salva com nome "Rodrigo Martins"):
- Adicionar suporte a **aliases/nomes alternativos** no cadastro do cliente — ou criar um campo "nome na gravação do Meet" que o sistema usa para fazer o matching. Assim "Rodrigo Martins" fica associado à Lucineia.
- Alternativa mais simples (imediata): o `sync-meet-recordings` verifica se **alguma sessão do dia já tem `recording_drive_id`** antes de aplicar Priority 3/4, evitando dupla atribuição.

**Caso geral (múltiplos clientes no mesmo dia)**:
- Remover o "Source 1b" completamente — gravações genéricas do Meet (nome tipo `GMT20260219...`) **nunca** devem ser atribuídas apenas pela data.
- Fazer o matching da gravação ser **obrigatoriamente por nome** no arquivo (Priority 1 e 2 do `sync-meet-recordings`), e para Lucineia especificamente, adicionar o nome alternativo "Rodrigo Martins" no cadastro.
- No `sync-meet-recordings`, adicionar o "nome alternativo" do cliente como critério de busca.

---

## O Que Será Implementado

### 1. Campo "Nome na gravação" no cadastro do cliente

No banco de dados, adicionar uma coluna `meet_display_name` na tabela `consulting_clients` — um campo opcional onde você pode colocar o nome que aparece nas gravações do Google Meet (por exemplo: "Rodrigo Martins" para a Lucineia).

Na interface de edição do cliente (`ConsultingClientDialog`), aparecerá um novo campo: **"Nome na gravação do Meet"** — pequeno, discreto, com um tooltip explicando que é o nome que aparece nas gravações quando outra pessoa agenda.

### 2. `sync-meet-recordings` — usar nome alternativo no matching

O Priority 2 passará a verificar tanto o `full_name` quanto o `meet_display_name`:
```
Priority 2a: nome do arquivo contém clientName (full_name)
Priority 2b: nome do arquivo contém meet_display_name (alias)
```

O Priority 3 (horário mais próximo) e Priority 4 (único do dia) serão tornados **mais conservadores**: só ativam se o dia em questão tiver apenas UMA sessão sem gravação associada. Se houver dois ou mais clientes sem gravação no mesmo dia, o sistema **não arrisca** — ele ignora e aguarda correspondência por nome.

### 3. `batch-import-transcripts` — remover "Source 1b"

O bloco "Source 1b" (linhas 347–356) que pegava gravações da pasta Meet Recordings **apenas pela data** será completamente removido.

Gravações genéricas do Meet (`GMT20260219...`) sem nome do cliente no arquivo **nunca** serão atribuídas automaticamente — pois esse é exatamente o comportamento que causou o cruzamento entre clientes.

A nova lógica de gravações no Meet Recordings:
- Se o **nome do arquivo** contém o nome do cliente (ou `meet_display_name`) → usa ✅
- Se o arquivo está dentro de **pasta específica do cliente** na Consultoria → usa ✅
- Se nenhuma das condições acima → não usa, aguarda intervenção manual ✅

### 4. Limpeza dos dados incorretos

Limpar a `transcription` e `ai_summary` da sessão da **Lucineia** (`id: 297aaba6`) que tem dados de outra reunião. Após a limpeza, o sistema vai reprocessar corretamente quando você abrir o dashboard dela, agora usando o `meet_display_name = "Rodrigo Martins"` para encontrar a gravação certa.

O Rodrigo Oliveira de Brito (`id: d149db95`) — a transcrição dele parece ser uma ata manual (começa com "Reunião Inicial: * Como utiliza..."), não uma gravação cruzada. Será mantido como está.

### 5. Dialog de Resumo dedicado (`ConsultingSessionsManager`)

O badge roxo "Resumo IA" no card da reunião vira um **botão clicável** que abre um **Dialog limpo** mostrando apenas:
- Título da reunião
- Data formatada
- Conteúdo do resumo em markdown formatado

Sem formulário, sem campos editáveis. O clique usa `e.stopPropagation()` para não abrir o formulário de edição.

---

## Arquivos a Modificar

| Arquivo | O que muda |
|---|---|
| Migração SQL | Adiciona coluna `meet_display_name` na tabela `consulting_clients` |
| `src/components/consulting/ConsultingClientDialog.tsx` | Campo "Nome na gravação" na edição do cliente |
| `supabase/functions/sync-meet-recordings/index.ts` | Usar `meet_display_name` no Priority 2; tornar Priority 3/4 conservadores (só 1 cliente no dia) |
| `supabase/functions/batch-import-transcripts/index.ts` | Remover "Source 1b" (matching por data); usar `meet_display_name` |
| `src/components/consulting/ConsultingSessionsManager.tsx` | Badge "Resumo IA" → abre Dialog dedicado de leitura |
| Limpeza de dados | Limpar transcrição/resumo errados da Lucineia |

---

## Resultado Esperado

Após a correção:
- **Lucineia**: você cadastra `meet_display_name = "Rodrigo Martins"` → o sistema encontra a gravação certa automaticamente
- **3 clientes no mesmo dia**: cada um associado pela correspondência de nome no arquivo — sem cruzamento
- **Gravações genéricas sem nome**: não são atribuídas automaticamente, evitando erros
- **Clicar em "Resumo IA"**: abre dialog limpo só com o resumo, sem formulário
