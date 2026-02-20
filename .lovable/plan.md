
## Diagnóstico Preciso dos Dois Problemas

### Problema 1: "Importar Transcrições e Resumos" retorna 0 importações

**Causa confirmada pelos logs:**

```
[batch-import] 1 recordings queued
[batch-import] Done: 0 transcriptions, 0 summaries
```

A gravação da Lucineia **foi encontrada** (pasta "Lucineira Cristina Martins Rodrigues" na Consultoria tem 1 gravação). Mas o `batch-import-transcripts` não transcreve gravações — ele só as coloca em `allPendingRecordings` e devolve na resposta para o frontend processar depois.

O problema é que o frontend (`batchImportTranscripts` em `ConsultingSessionsManager.tsx`) **ignora completamente** o campo `pending_recordings` da resposta. Ele só exibe `data.transcriptions` e `data.summaries`, que são zero — porque as gravações precisam de um passo extra (STT via ElevenLabs).

### Problema 2: Botão "Transcrever" dá erro (context canceled / Memory limit exceeded)

**Causa confirmada pelos logs:**

```
[transcribe-meeting] Memory limit exceeded
[transcribe-recording] context canceled
```

Ambas as funções tentam **baixar o arquivo de vídeo completo** (centenas de MBs) para a memória do Edge Function antes de enviar ao ElevenLabs. Edge Functions têm limite de ~150MB de memória e ~150 segundos de execução — arquivos de reunião de 60 min facilmente excedem isso.

A `transcribe-recording` tentou resolver isso com streaming multipart, mas o `context canceled` indica que a conexão é cancelada antes de completar — provavelmente porque o Google Drive não suporta streaming de leitura sem buffering completo nesse contexto.

---

## Solução em Duas Partes

### Parte 1: Corrigir "Importar Transcrições e Resumos" para processar as gravações pendentes

O `batch-import-transcripts` já encontra as gravações e as devolve em `pending_recordings`. O que falta é o frontend receber essa lista e chamar `transcribe-recording` para cada uma.

**Mudança no `ConsultingSessionsManager.tsx` — função `batchImportTranscripts`:**

Após receber a resposta do `batch-import`, verificar se há `pending_recordings`. Se houver, chamar `transcribe-recording` para cada um sequencialmente, mostrando progresso ao usuário (ex: "Transcrevendo reunião 1 de 3...").

### Parte 2: Resolver o timeout/memory limit na transcrição

O problema real é que o Edge Function não consegue lidar com arquivos grandes de vídeo de reunião do Google Drive.

**Solução: usar URL de streaming direto do Drive e passar para ElevenLabs via URL (se suportado) OU dividir a responsabilidade**

A ElevenLabs Scribe v2 aceita upload por URL? Não diretamente — precisa do arquivo. Então a solução mais robusta é usar uma **URL pré-assinada temporária** do Google Drive e fazer o ElevenLabs acessar diretamente.

ElevenLabs Speech-to-Text aceita `file_url` como parâmetro alternativo ao upload de arquivo — isso significa que podemos passar a URL direta do Drive (com token de acesso) e o ElevenLabs baixa o arquivo diretamente, sem passar pela memória do Edge Function.

**Implementação:**

Na `transcribe-recording`, em vez de baixar o arquivo e fazer upload via FormData, usar a API do ElevenLabs com `file_url`:

```
POST https://api.elevenlabs.io/v1/speech-to-text
Content-Type: application/json

{
  "model_id": "scribe_v2",
  "language_code": "por",
  "diarize": true,
  "file_url": "https://www.googleapis.com/drive/v3/files/{fileId}?alt=media&access_token={token}"
}
```

Isso resolve o problema de memória completamente — o Edge Function apenas passa a URL e o ElevenLabs faz o download diretamente.

**Nota importante:** Verificar se ElevenLabs suporta `file_url`. Se não suportar, a alternativa é usar o **streaming multipart corretamente** — a função já tenta isso, mas o problema é que o `fetch` do Deno com `ReadableStream` no body pode não suportar bem a leitura simultânea do Drive + escrita para ElevenLabs. A solução alternativa seria fazer o download em chunks para o Storage do Supabase e depois fazer upload de lá, mas isso adiciona complexidade. A abordagem `file_url` é a mais limpa.

---

## O Que Será Alterado

### 1. `supabase/functions/transcribe-recording/index.ts`

Modificar para usar `file_url` na API do ElevenLabs em vez de baixar o arquivo para a memória:

```typescript
// Em vez de:
const driveResp = await fetch(driveUrl, { ... });
const blob = await driveResp.blob(); // ← causa memory limit
formData.append('file', blob, ...);

// Usar:
const driveFileUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`;
const body = JSON.stringify({
  model_id: 'scribe_v2',
  language_code: 'por',
  diarize: true,
  file_url: driveFileUrl,
});
const sttResp = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
  method: 'POST',
  headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
  body,
});
```

Isso elimina completamente o download do arquivo para memória — o ElevenLabs acessa o Drive diretamente usando o access token temporário do Google.

### 2. `src/components/consulting/ConsultingSessionsManager.tsx`

Modificar `batchImportTranscripts` para processar as gravações pendentes retornadas pelo `batch-import`:

```typescript
const batchImportTranscripts = async () => {
  setImporting(true);
  try {
    const { data, error } = await supabase.functions.invoke('batch-import-transcripts', {
      body: { clientId },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    // Se há gravações pendentes, transcrever cada uma
    const pendingRecordings = data.pending_recordings || [];
    if (pendingRecordings.length > 0) {
      toast.info(`Transcrevendo ${pendingRecordings.length} gravação(ões)...`);
      let successCount = 0;
      for (let i = 0; i < pendingRecordings.length; i++) {
        const rec = pendingRecordings[i];
        try {
          // Update toast with progress
          toast.info(`Transcrevendo reunião ${i + 1} de ${pendingRecordings.length}: "${rec.sessionTitle}"`);
          const { data: tData, error: tError } = await supabase.functions.invoke('transcribe-recording', {
            body: {
              userId: user?.id,
              sessionId: rec.sessionId,
              fileId: rec.fileId,
              fileName: rec.fileName,
              force: false,
            },
          });
          if (!tError && !tData?.error) successCount++;
        } catch (e) {
          console.warn(`Failed to transcribe "${rec.sessionTitle}":`, e);
        }
      }
      toast.success(`${successCount} reunião(ões) transcritas e resumidas com sucesso!`);
      fetchSessions();
    } else {
      toast.success(
        `${data.transcriptions} transcrição(ões) importada(s), ${data.summaries} resumo(s) gerado(s)`
      );
    }
    fetchSessions();
  } catch (error: any) {
    toast.error(error.message || 'Erro ao importar transcrições');
  } finally {
    setImporting(false);
  }
};
```

### 3. Atualizar `autoProcess` também

O `autoProcess` (que roda automaticamente ao abrir o dashboard) também chama `transcribe-recording` e vai ter o mesmo problema de timeout. Corrigir para usar a mesma lógica via `file_url`.

---

## Resumo dos Arquivos

| Arquivo | Mudança |
|---|---|
| `supabase/functions/transcribe-recording/index.ts` | Usar `file_url` no ElevenLabs em vez de download para memória — elimina timeout e memory limit |
| `src/components/consulting/ConsultingSessionsManager.tsx` | `batchImportTranscripts` processa `pending_recordings` chamando `transcribe-recording` sequencialmente com feedback de progresso |

Após essas correções:
- Clicar em "Importar Transcrições e Resumos" encontrará a gravação da Lucineia, mostrará "Transcrevendo reunião 1 de 1..." e salvará a transcrição + resumo corretamente
- Clicar em "Transcrever" também funcionará sem timeout, pois o ElevenLabs acessa o arquivo diretamente no Drive
- O mesmo funciona para todos os outros clientes com gravações no Drive
