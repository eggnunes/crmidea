

# Importar Transcrições do Google Drive e Gerar Resumos Automaticamente

## Situacao Atual

- Existem **muitas sessoes duplicadas** no banco (ex: Victor Hugo com 8 registros para a mesma data)
- **Nenhuma sessao** tem transcrição ou resumo ainda
- **Nenhuma sessao** tem gravação vinculada
- As transcricoes do Google Meet estao na pasta "Meet Recordings" no Google Drive
- As gravacoes de video estao em pastas com nomes dos clientes dentro de "Minha Mentoria/Turma dois/Consultoria"

## Etapas do Plano

### Etapa 1 - Limpar sessoes duplicadas no banco de dados

Antes de importar, preciso remover os registros duplicados. Existem sessoes com mesmo titulo, mesma data e mesmo cliente repetidas ate 8 vezes. Vou manter apenas uma de cada.

### Etapa 2 - Criar Edge Function `batch-import-transcripts`

Nova funcao backend que faz tudo automaticamente:

1. Busca a pasta "Meet Recordings" no Google Drive
2. Lista todos os arquivos de transcricao (`.txt`, `.sbv`, `.vtt` ou documentos Google) dessa pasta
3. Para cada arquivo de transcricao:
   - Extrai a data de criacao do arquivo
   - Tenta associar a uma sessao existente no banco (por data + nome do cliente no titulo)
   - Se encontrar correspondencia, baixa o conteudo da transcricao
   - Salva o texto na coluna `transcription` da sessao
4. Para cada sessao que recebeu transcricao, gera um resumo estruturado com IA (Lovable AI / Gemini)
5. Salva o resumo na coluna `ai_summary`

**Arquivo:** `supabase/functions/batch-import-transcripts/index.ts`

Logica de matching:
- Compara a data de criacao do arquivo com a data da sessao (mesmo dia)
- Busca o nome do cliente no titulo do arquivo da transcricao
- Se houver apenas uma sessao naquele dia, associa automaticamente

### Etapa 3 - Adicionar botao na interface

**Arquivo:** `src/components/consulting/ConsultingSessionsManager.tsx`

Adicionar um botao "Importar Transcricoes e Resumos" que:
- Chama a nova funcao `batch-import-transcripts`
- Mostra progresso (quantas transcricoes encontradas, quantos resumos gerados)
- Atualiza a lista de sessoes ao finalizar

Tambem adicionar um botao global na pagina de consultoria para importar para TODOS os clientes de uma vez.

### Etapa 4 - Sincronizar gravacoes de video

Antes das transcricoes, rodar o `sync-meet-recordings` para vincular os videos das pastas dos clientes (Minha Mentoria/Turma dois/Consultoria/[NomeCliente]) as sessoes. Isso complementa a importacao.

## Resumo tecnico dos arquivos

| Arquivo | Acao |
|---------|------|
| Banco de dados | Remover sessoes duplicadas |
| `supabase/functions/batch-import-transcripts/index.ts` | Nova funcao - importar transcricoes do Drive + gerar resumos com IA |
| `src/components/consulting/ConsultingSessionsManager.tsx` | Adicionar botoes "Importar Transcricoes" |

## Resultado esperado

Ao clicar no botao, o sistema vai:
1. Buscar todas as transcricoes no Google Drive
2. Associar cada transcricao a reuniao correta de cada cliente
3. Gerar resumos automaticos com IA para cada reuniao transcrita
4. Exibir tudo no dashboard de cada cliente (transcricao + resumo)
