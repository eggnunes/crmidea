

# Corrigir Importacao de Transcricoes - Matching por Nome do Cliente

## Problema Identificado

A logica atual de associacao (matching) entre arquivos do Google Drive e sessoes de clientes esta incorreta. O codigo atual:

1. Divide o nome do cliente em partes (ex: "Ana Cristina de Almeida" -> ["ana", "cristina", "almeida"])
2. Aceita match se **qualquer** parte com mais de 2 caracteres aparecer no nome do arquivo
3. Isso causa matches falsos: "Ana" casa com arquivo de outro cliente, "Luiz" casa com arquivo errado, etc.

## Plano de Correcao

### Passo 1 - Limpar dados incorretos

Apagar as transcricoes e resumos importados incorretamente nas 6 sessoes afetadas (set `transcription = NULL`, `ai_summary = NULL`, `summary_generated_at = NULL`).

### Passo 2 - Corrigir logica de matching

Reescrever a funcao de matching no `batch-import-transcripts/index.ts` com regras mais rigorosas:

- **Regra principal**: O nome do arquivo DEVE conter o **sobrenome** do cliente (ultima parte significativa do nome, ignorando preposicoes como "de", "da", "dos")
- **Validacao extra**: Alem do sobrenome, exigir pelo menos mais uma parte do nome (primeiro nome ou nome do meio) para confirmar
- **Remover fallbacks perigosos**: Eliminar a Prioridade 2 (proximidade de horario) e Prioridade 3 (unico arquivo do dia) que causam matches errados
- Adicionar uma nova action `list-files` para debug, listando os arquivos encontrados no Drive antes de associar

### Passo 3 - Adicionar action de limpeza

Adicionar uma action `clean` na edge function que limpa transcricoes/resumos existentes para permitir re-importacao.

### Passo 4 - Re-executar

1. Executar action `clean` para limpar dados errados
2. Executar action `list-files` para ver os arquivos disponiveis e seus nomes
3. Executar a importacao com a logica corrigida
4. Verificar os resultados

## Detalhes Tecnicos

### Arquivo modificado
- `supabase/functions/batch-import-transcripts/index.ts`

### Nova logica de matching (pseudocodigo)

```text
Para cada sessao sem transcricao:
  1. Extrair sobrenome do cliente (ignorando "de", "da", "dos", "das", "do")
  2. Para cada arquivo do mesmo dia:
     - Normalizar nome do arquivo
     - Verificar se contem o SOBRENOME do cliente
     - Se sim, verificar se contem tambem o PRIMEIRO NOME
     - So aceitar match se ambos estiverem presentes
  3. Se nenhum match, pular (NAO usar fallbacks de horario ou arquivo unico)
```

### Nova action `clean`
Limpa `transcription`, `ai_summary` e `summary_generated_at` de todas as sessoes (ou de um cliente especifico se `clientId` for informado).

