

# Buscar Transcricoes E Gravar Reunioes na Pasta "Consultoria" do Drive

## Problema

A funcao atual busca apenas arquivos de texto (transcricoes prontas). Porem, muitos clientes tem reunioes gravadas (arquivos de video/audio como .mp4, .webm) que nao possuem transcricao associada. O sistema precisa:

1. Buscar transcricoes prontas (txt, Google Docs, vtt, srt)
2. Se nao encontrar transcricao, buscar a gravacao da reuniao (mp4, webm, etc.)
3. Transcrever a gravacao usando ElevenLabs Scribe v2 (ja configurado no projeto com secret `ELEVENLABS_API_KEY`)
4. Gerar resumo com IA (Gemini) a partir da transcricao

## Plano de Implementacao

### Passo 1 - Limpar dados existentes

Executar action `clean` para garantir fresh start.

### Passo 2 - Atualizar Edge Function `batch-import-transcripts`

Modificar `supabase/functions/batch-import-transcripts/index.ts`:

#### 2.1 - Adicionar action `explore-path`
Para debugar a estrutura de pastas do Drive, navegando nivel por nivel (ex: `["Minha Mentoria", "Turma 2", "Consultoria"]`).

#### 2.2 - Buscar na pasta "Consultoria" alem de "Meet Recordings"
- Navegar ate "Minha Mentoria" > subpasta com "Turma" ou "Consultoria" > "Consultoria"
- Listar subpastas de clientes
- Usar `fileMatchesClient` para associar pasta ao cliente cadastrado

#### 2.3 - Buscar TODOS os tipos de arquivo
Dentro de cada pasta de cliente, buscar em duas etapas:

```text
Etapa 1: Transcricoes prontas
  - mimeType: text/plain, Google Docs, text/vtt, application/x-subrip
  - Se encontrou -> usar diretamente

Etapa 2: Gravacoes (se nao achou transcricao)
  - mimeType: video/mp4, video/webm, audio/mpeg, audio/mp4, audio/webm
  - Se encontrou -> transcrever via ElevenLabs STT
  - ElevenLabs endpoint: POST https://api.elevenlabs.io/v1/speech-to-text
  - Modelo: scribe_v2, idioma: por, diarize: true
  - Limite: 100MB por arquivo (ja tratado no codigo existente)
```

#### 2.4 - Associar arquivos a sessoes por ordem cronologica
- Ordenar arquivos por `createdTime` (mais antigo primeiro)
- Ordenar sessoes sem transcricao do cliente por `session_date` (mais antiga primeiro)
- Associar 1-para-1

#### 2.5 - Gerar resumos com IA
Para cada sessao que recebeu transcricao (seja de arquivo texto ou de gravacao transcrita), gerar resumo com Gemini via Lovable AI Gateway (ja implementado).

### Passo 3 - Executar

1. Usar `explore-path` para confirmar estrutura de pastas
2. Executar importacao completa
3. Verificar resultados

## Detalhes Tecnicos

### Arquivo modificado
- `supabase/functions/batch-import-transcripts/index.ts`

### Fluxo completo de import

```text
Para cada cliente cadastrado com sessoes sem transcricao:
  1. Buscar em "Meet Recordings" por arquivos de texto com nome do cliente
  2. Buscar pasta do cliente em "Consultoria" (match por nome)
  3. Dentro da pasta do cliente:
     a. Buscar transcricoes prontas (txt, docs, vtt, srt)
     b. Se nao encontrou transcricao, buscar gravacoes (mp4, webm, audio)
     c. Se encontrou gravacao:
        - Baixar o arquivo via Drive API
        - Verificar tamanho (< 100MB)
        - Enviar para ElevenLabs STT (scribe_v2, portugues, com diarizacao)
        - Salvar transcricao resultante
  4. Associar arquivos encontrados as sessoes por ordem cronologica
  5. Gerar resumo com IA para cada sessao que recebeu transcricao
```

### Consideracoes importantes
- ElevenLabs tem limite de 100MB por arquivo. Gravacoes maiores serao puladas com log de aviso
- A transcricao via ElevenLabs pode demorar varios minutos por arquivo. O processo total pode levar bastante tempo
- Arquivos de video grandes podem causar timeout na Edge Function (limite ~150s). Se necessario, processar em lotes menores
- Para evitar timeout, processar no maximo 3-5 gravacoes por execucao, com opcao de re-executar para continuar

### Tratamento de timeout
- Adicionar contador de gravacoes transcritas via ElevenLabs
- Apos 3 transcricoes de audio/video, parar e retornar resultado parcial com flag `has_more: true`
- Permitir re-execucao para continuar de onde parou (sessoes ja com transcricao sao puladas automaticamente)

