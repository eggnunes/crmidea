
# Plano: Automacao de Gravacoes do Google Meet + Transcricao e Resumo com IA

## Contexto Atual

- Voce ja tem o Google Calendar conectado via OAuth (com `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`)
- A tabela `consulting_sessions` ja existe com campos como `summary`, `notes`, `next_steps`
- Voce tem a chave do ElevenLabs configurada (`ELEVENLABS_API_KEY`) para transcricao de audio
- Voce tem o Lovable AI (`LOVABLE_API_KEY`) para gerar resumos

## O Problema

Hoje, apos cada reuniao pelo Google Meet, voce precisa manualmente:
1. Ir ate o Google Drive onde a gravacao foi salva
2. Alterar as permissoes do arquivo para "leitor publico"
3. Copiar o link
4. Abrir o dashboard da consultoria do cliente
5. Colar o link na sessao correspondente

Alem disso, nao existe transcricao nem resumo automatico das reunioes.

## Solucao Proposta

A solucao sera dividida em 3 partes:

### Parte 1 - Expandir o acesso ao Google Drive

Atualmente, a integracao com o Google usa apenas escopos de **Calendar**. Para acessar as gravacoes do Meet (que sao salvas automaticamente no Google Drive), precisaremos adicionar escopos do **Google Drive (somente leitura)**.

**O que muda:** Ao reconectar o Google Calendar, o sistema pedira permissao adicional para ler arquivos do Google Drive. Isso permite localizar automaticamente as gravacoes do Meet.

**Importante:** Voce precisara reconectar o Google Calendar uma unica vez para autorizar o novo escopo.

### Parte 2 - Buscar gravacoes automaticamente

Uma nova funcao backend sera criada para:
1. Usar o token do Google ja armazenado para acessar o Google Drive
2. Buscar arquivos de gravacao do Google Meet (que ficam na pasta "Meet Recordings" do Drive)
3. Ao encontrar uma gravacao correspondente a uma sessao, automaticamente:
   - Gerar um link compartilhavel (com permissao de leitor)
   - Salvar o link na sessao de consultoria correspondente

A correspondencia entre gravacao e sessao sera feita pela **data da reuniao** e pelo **titulo do evento do Calendar** (que ja e sincronizado).

### Parte 3 - Transcricao e Resumo com IA

O Google Meet, quando a gravacao esta ativada, tambem gera **transcricoes automaticas** que ficam salvas no Drive como arquivos de texto. O sistema ira:

1. Buscar a transcricao do Meet no Drive (arquivo `.txt` ou `.docx` gerado automaticamente)
2. Se a transcricao do Meet nao estiver disponivel, usar o **ElevenLabs** (que ja esta configurado) para transcrever o audio da gravacao
3. Com a transcricao em maos, usar o **Lovable AI** para gerar um resumo estruturado contendo:
   - Topicos discutidos
   - Decisoes tomadas
   - Proximos passos
   - Pontos de atencao
4. Salvar a transcricao e o resumo na sessao de consultoria

### Interface no Dashboard

Na aba "Atas de Reuniao" do detalhe de cada cliente, cada sessao passara a exibir:
- Link para a gravacao (com botao para abrir no Google Drive)
- Botao "Buscar Gravacao" para importar manualmente a gravacao de uma sessao especifica
- Botao "Sincronizar Gravacoes" para buscar todas as gravacoes pendentes de uma vez
- Transcricao completa da reuniao (expansivel)
- Resumo gerado pela IA (com topicos, decisoes e proximos passos)
- Botao para regenerar o resumo se necessario

## Etapas de Implementacao

### 1. Alterar o banco de dados

Adicionar novas colunas a tabela `consulting_sessions`:
- `recording_url` (texto) - Link publico da gravacao no Google Drive
- `recording_drive_id` (texto) - ID do arquivo no Google Drive
- `transcription` (texto longo) - Transcricao completa da reuniao
- `ai_summary` (texto longo) - Resumo gerado pela IA (separado do campo `summary` manual)
- `summary_generated_at` (timestamp) - Quando o resumo foi gerado

### 2. Expandir os escopos OAuth do Google

Atualizar a funcao `google-calendar-auth` para incluir o escopo:
- `https://www.googleapis.com/auth/drive.readonly` (leitura do Drive)

### 3. Criar funcao backend "sync-meet-recordings"

Nova funcao que:
- Recebe o ID do cliente ou da sessao
- Usa a API do Google Drive para buscar gravacoes na pasta "Meet Recordings"
- Faz a correspondencia por data/titulo
- Configura permissao de compartilhamento publico (leitor)
- Salva o link na sessao

### 4. Criar funcao backend "transcribe-meeting"

Nova funcao que:
- Recebe o ID da sessao
- Busca a transcricao do Meet no Drive (se disponivel)
- Se nao houver transcricao, baixa o audio e usa ElevenLabs para transcrever
- Salva a transcricao na sessao

### 5. Criar funcao backend "summarize-meeting"

Nova funcao que:
- Recebe a transcricao da reuniao
- Usa o Lovable AI (Gemini) para gerar um resumo estruturado
- Salva o resumo na sessao

### 6. Atualizar o componente ConsultingSessionsManager

- Adicionar coluna/badge de gravacao em cada sessao
- Adicionar botoes de sincronizacao e transcricao
- Exibir transcricao e resumo expandiveis
- Botao para regenerar resumo

### 7. Atualizar a area do cliente

Na area que o cliente acessa, tambem exibir:
- Link para assistir a gravacao
- Resumo da reuniao (somente leitura)

## Fluxo Automatico Simplificado

```text
Voce faz reuniao no Meet
        |
        v
Gravacao salva no Drive automaticamente
        |
        v
No dashboard, clica "Sincronizar Gravacoes"
        |
        v
Sistema busca gravacoes no Drive
        |
        v
Encontra correspondencia por data/titulo
        |
        v
Gera link publico + busca transcricao
        |
        v
IA gera resumo estruturado
        |
        v
Tudo aparece na aba "Reunioes" do cliente
```

## Observacao Importante

Para que funcione, voce precisara:
1. **Reconectar o Google Calendar** uma vez (para autorizar o acesso ao Drive)
2. Manter a **gravacao ativa** nas reunioes do Google Meet
3. Idealmente, ativar a **transcricao automatica** no Google Meet (nas configuracoes do Google Workspace) para obter melhores resultados

## Resumo dos Arquivos que Serao Criados/Modificados

- **Banco de dados**: Adicionar 5 colunas a `consulting_sessions`
- **`supabase/functions/google-calendar-auth/index.ts`**: Adicionar escopo do Drive
- **`supabase/functions/sync-meet-recordings/index.ts`**: Nova funcao (buscar gravacoes)
- **`supabase/functions/transcribe-meeting/index.ts`**: Nova funcao (transcricao)
- **`supabase/functions/summarize-meeting/index.ts`**: Nova funcao (resumo IA)
- **`src/components/consulting/ConsultingSessionsManager.tsx`**: Atualizar UI
- **`supabase/config.toml`**: Registrar novas funcoes
