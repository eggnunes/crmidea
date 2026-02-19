
## Diagnóstico do Problema

**O que está acontecendo:**
A reunião da Sueli Dias tem um arquivo de texto gerado pelo **Tactiq AI** (extensão de navegador que cria transcrições automáticas) salvo na mesma pasta do Google Drive. O sistema está importando esse arquivo de texto em vez de baixar e transcrever a gravação de vídeo real da reunião.

A transcrição salva começa com:
```
01:08:19.501,01:08:22.501
advocacia adv: Olá, estou transcrevendo esta chamada com minha extensão Tactiq AI.
```

**Causa raiz no código (`batch-import-transcripts/index.ts`, linha 608-613):**
A função ordena os arquivos dando **prioridade a arquivos de texto** sobre gravações:
```typescript
availableFiles.sort((a, b) => {
  // Text files first  ← ESTE É O PROBLEMA
  if (a.type !== b.type) return a.type === 'text' ? -1 : 1;
  ...
});
```

Isso faz com que qualquer `.txt`, `.vtt` ou `.doc` salvo pelo Tactiq seja usado como transcrição antes da gravação real.

**Além disso:** Como a sessão já tem `transcription` (do Tactiq), o `transcribe-recording` pula o processamento da gravação real (linha 134):
```typescript
if (session.transcription) {
  console.log('Session already has transcription, skipping STT');
  ...
}
```

---

## Solução Completa

### 1. Filtrar arquivos do Tactiq na função `batch-import-transcripts`

Adicionar uma função de detecção que identifica se um arquivo de texto é gerado pelo Tactiq (baseado no conteúdo típico do Tactiq como "Tactiq AI", "tactiq.io", etc.) e **ignora esses arquivos** durante a importação. Somente arquivos de texto que pareçam atas manuais (escritas pelo consultor) devem ser usados.

**Lógica:** Ao baixar um arquivo de texto, verificar se o conteúdo contém marcas do Tactiq antes de salvar como transcrição.

### 2. Inverter a prioridade: Gravações antes de textos automáticos

Para reuniões que têm uma gravação de vídeo disponível, **priorizar a transcrição via ElevenLabs** (da gravação real) em vez de importar arquivos de texto automáticos. Arquivos de texto manuais (atas) só devem ser usados quando não houver gravação.

**Nova ordem de prioridade:**
1. Gravação de vídeo/áudio → transcrever com ElevenLabs Scribe v2 (transcrição real)
2. Arquivo de texto manual (sem marcas de ferramentas automáticas) → importar diretamente
3. Nenhum arquivo → sessão sem transcrição

### 3. Limpar a transcrição errada da Sueli e reprocessar

Adicionar uma ação para **limpar** a transcrição/resumo incorreto da sessão específica da Sueli e iniciar o reprocessamento correto via a gravação de vídeo que já está vinculada (`recording_drive_id: 1sCYdC1rOOhRctEaJEpbbGbDEC4JpWghd`).

### 4. Forçar reprocessamento no `transcribe-recording`

Adicionar um parâmetro `force: true` à função `transcribe-recording` que permite **sobrescrever** uma transcrição existente, iniciando o processamento do vídeo mesmo se já houver texto salvo.

### 5. Melhorar a UI — Botão "Retranscrever" com opção de forçar

No `ConsultingSessionsManager`, adicionar um botão **"Retranscrever (forçar)"** para sessões que já têm transcrição mas que precisam ser refeitas a partir da gravação real.

---

## Arquivos que serão alterados

| Arquivo | O que muda |
|---|---|
| `supabase/functions/batch-import-transcripts/index.ts` | Filtrar Tactiq, inverter prioridade (gravação antes de texto) |
| `supabase/functions/transcribe-recording/index.ts` | Suportar parâmetro `force: true` para sobrescrever transcrições |
| `src/components/consulting/ConsultingSessionsManager.tsx` | Botão "Retranscrever" que passa `force: true` para sessões já transcritas |

---

## Resultado Esperado

Após a correção:
- Sessões com gravação de vídeo → transcrição real feita pelo ElevenLabs do áudio da reunião
- Arquivos do Tactiq → ignorados automaticamente
- Ata manual (escrita pelo consultor) → ainda importada normalmente quando não há gravação
- A sessão da Sueli será limpa e reprocessada a partir do vídeo real
