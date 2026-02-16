

# Plano: Corrigir o Dashboard da Sueli Dias

## Problema Real

Quando a Sueli faz login com `suelip.dias123@gmail.com`, o sistema:

1. Encontra o perfil dela na tabela `client_profiles` (user_id `63413909...`)
2. Mas esse perfil tem o email `advadvocacia82@gmail.com` (email errado)
3. Usa esse email errado para buscar os dados na tabela `consulting_clients`
4. Encontra o registro de `advadvocacia82@gmail.com` que esta **vazio** (sem prompts, sem plano, sem etapas)
5. O registro correto, com todos os dados, esta em `suelip.dias123@gmail.com`

## Correcoes no Banco de Dados

### 1. Atualizar o email no perfil da Sueli

Alterar o campo `email` na tabela `client_profiles` de `advadvocacia82@gmail.com` para `suelip.dias123@gmail.com`. Assim, quando ela logar, o dashboard buscara os dados no registro correto.

### 2. Remover o registro duplicado vazio

Deletar o registro `consulting_clients` com email `advadvocacia82@gmail.com` (ID `3a79034f...`), que nao tem prompts nem plano de implementacao. O registro correto com todos os dados (`suelip.dias123@gmail.com`, ID `89fd4209...`) permanece intacto.

## Correcao no Codigo

### 3. Tornar a busca mais resiliente

**Arquivo:** `src/pages/ClientDashboardPage.tsx`

Adicionar uma busca alternativa: se nao encontrar dados pelo email do perfil, tentar tambem pelo email de login do usuario (que vem do `auth.users`). Isso previne que problemas semelhantes ocorram com outros clientes no futuro.

A logica sera:
1. Buscar consulting_clients pelo email do perfil (comportamento atual)
2. Se nao encontrar, buscar pelo email de login do usuario
3. Usar o primeiro resultado que tiver dados

## Resumo

| Acao | Detalhe |
|------|---------|
| Corrigir email do perfil | `advadvocacia82@gmail.com` -> `suelip.dias123@gmail.com` |
| Remover registro vazio | Deletar consulting_clients `advadvocacia82@gmail.com` |
| Melhorar busca no codigo | Fallback para email de login se email do perfil nao retornar dados |

## Resultado esperado

A Sueli faz login com `suelip.dias123@gmail.com`, o dashboard busca os dados com esse email, e todas as etapas, prompts e plano de implementacao aparecem normalmente.
