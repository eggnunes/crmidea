
## Análise Completa dos Problemas

### Problema 1 (Principal): Reuniões da Sueli não existem no banco

A Sueli tem apenas **1 sessão** no banco (05/02/2026), com 1 gravação, transcrição e resumo. Mas o usuário diz que já fez várias reuniões com ela.

**Causa raiz do `sync-calendar-sessions`:** O Google Calendar é buscado por e-mail da cliente (`suelip.dias123@gmail.com`) e por primeiro nome (`Sueli`). Se as reuniões do Google Calendar foram criadas sem o e-mail da Sueli como participante (por exemplo, o evento foi criado manualmente ou por um link genérico), a busca por e-mail não retorna nada. Já a busca por primeiro nome busca apenas `q: 'Sueli'` — pode não encontrar eventos com o título "Consultoria e Mentoria Individual IDEA (Sueli Pereira Dias)" dependendo de como o Google indexa.

**Consequência:** O `sync-meet-recordings` nunca encontra as outras gravações da Sueli porque **as sessões correspondentes nem existem no banco** — sem sessão no banco, não há o que vincular.

---

### Problema 2: Busca de pastas no Drive é limitada e falha para a estrutura real

A função `sync-meet-recordings` busca pastas assim:
```
mimeType='application/vnd.google-apps.folder' and name contains 'Sueli pereira Dias'
```

Mas a pasta no Drive é provavelmente chamada apenas **"Sueli"** ou **"Sueli Dias"** dentro de `Minha Mentoria > Turma 2 > Consultoria`. A função:
- Não navega pela hierarquia de pastas
- Usa o nome completo do cadastro (com maiúsculas/minúsculas inconsistentes)
- Não encontra a pasta → não carrega as gravações de dentro dela
- Resultado: busca genérica por "Meet recordings" no Drive todo, que só retorna 1 arquivo (o mais recente que bate na busca por data)

---

### Problema 3: Query de sessões exclui sessões já com `recording_drive_id`

A query na linha 84 do `sync-meet-recordings`:
```typescript
.is('recording_url', null)
```
Filtra apenas sessões **sem** `recording_url`. Isso significa que se uma sessão já tem uma gravação, ela é excluída do processo — o que é correto para não duplicar. Mas o problema é que as outras reuniões da Sueli simplesmente não existem como sessões.

---

## Solução Completa em 3 Etapas

### Etapa 1: Criar nova edge function `scan-drive-recordings`

Uma função dedicada para **navegar a hierarquia de pastas do Drive** e catalogar todas as gravações por cliente, sem depender de sessões previamente cadastradas:

```
Minha Mentoria/
  Turma 2/
    Consultoria/
      [Nome do Cliente]/          ← pasta do cliente
        gravacao-da-reuniao.mp4   ← arquivo diretamente na pasta
        Gravações das Reuniões/   ← ou subpasta
          gravacao-1.mp4
          gravacao-2.mp4
```

A função vai:
1. Localizar a pasta `Minha Mentoria` no Drive raiz
2. Navegar para `Turma 2 > Consultoria`
3. Listar subpastas (uma por cliente)
4. Para cada subpasta, listar arquivos MP4 (recursivamente incluindo subpastas como "Gravações das Reuniões")
5. Retornar um mapa: `{ nomePasta → [{ fileId, fileName, createdTime }] }`

### Etapa 2: Refatorar `sync-meet-recordings` para usar hierarquia de pastas

Mudanças principais:
- **Navegar pelo caminho `Minha Mentoria > Turma 2 > Consultoria`** primeiro para encontrar as pastas dos clientes
- **Match flexível entre nome da pasta e nome do cliente** no banco: usar primeiros nomes e normalização (remover acentos, maiúsculas)
- **Para cada gravação encontrada na pasta do cliente:** verificar se já existe uma sessão no banco na mesma data (±2 horas). Se existe → vincular. Se não existe → **criar a sessão automaticamente** e vincular
- **Busca recursiva em subpastas** dentro da pasta do cliente (para o caso de ter uma pasta "Gravações das Reuniões" dentro)

### Etapa 3: Melhorar `sync-calendar-sessions` para Sueli e casos similares

O problema adicional: para a Sueli, se os eventos do Google Calendar não têm ela como participante (lista de attendees), a busca por e-mail não encontra nada. A busca por nome `q: 'Sueli'` pode não bater nos títulos dos eventos que têm "SUELI" em maiúsculas.

Correção:
- Buscar também pelo primeiro nome em **maiúsculas** e pelo nome completo
- Usar também o sobrenome como termo de busca alternativo
- **Fallback: se a função de Drive encontrou gravações na pasta do cliente mas não há sessão correspondente, criar a sessão automaticamente** (com data extraída do `createdTime` do arquivo ou do nome do arquivo)

---

## Fluxo Completo Corrigido

```text
[Botão "Sincronizar Gravações"]
         ↓
1. Navegar Drive: Minha Mentoria → Turma 2 → Consultoria
         ↓
2. Para cada subpasta (ex: "Sueli"):
   - Match flexível com clientes do banco
   - Listar todos os MP4 na pasta + subpastas
         ↓
3. Para cada arquivo MP4 encontrado:
   a. Já existe sessão no banco na mesma data?
      → SIM: vincular recording_drive_id à sessão
      → NÃO: criar sessão nova com data do arquivo, vincular
         ↓
4. Auto-transcrever sessões novas com gravação
         ↓
5. Gerar resumo IA para sessões transcritas
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---|---|
| `supabase/functions/sync-meet-recordings/index.ts` | Reescrever busca de Drive: navegar hierarquia `Minha Mentoria > Turma 2 > Consultoria`, busca recursiva em subpastas, criar sessões automaticamente quando não existem no banco, match flexível de nomes |
| `supabase/functions/sync-calendar-sessions/index.ts` | Melhorar busca de nome: incluir variações em maiúsculas, sobrenome separado, e fallback para ignorar case |

Nenhuma mudança de banco de dados necessária — as tabelas existentes já suportam tudo isso.

---

## Resultado Esperado

- **Sueli**: Ao clicar em "Sincronizar Gravações", o sistema navega para `Minha Mentoria/Turma 2/Consultoria/Sueli/`, encontra todas as gravações, cria sessões para as que não existem ainda, vincula, transcreve e gera resumo
- **Todos os outros clientes**: Mesmo fluxo — se tiver pasta com nome compatível no Drive, todas as gravações são importadas e processadas
- **Gravações não atribuíveis**: Se não houver pasta de cliente compatível no Drive, a função cai no método atual (busca por nome no arquivo e correspondência por data)
