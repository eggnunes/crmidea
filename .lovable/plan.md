

# Corrigir chamada duplicada do callback OAuth do Google Calendar

## Problema

Quando voce retorna do Google apos autorizar, o `useEffect` do React dispara **multiplas vezes** (comportamento normal do React 18 com StrictMode). Cada disparo tenta trocar o mesmo codigo OAuth por tokens. A primeira chamada funciona, mas as seguintes falham com `invalid_grant` porque o codigo ja foi usado.

Resultado: os tokens sao salvos com sucesso e o tick verde aparece, mas o erro da chamada duplicada tambem aparece como toast.

## Evidencia

Os logs mostram exatamente isso:
- 4 chamadas de `exchange-code` no mesmo segundo
- 2 retornaram "Tokens stored successfully"
- 2 retornaram "invalid_grant: Bad Request"

O banco de dados confirma que os tokens estao salvos e validos (expiracao em 1 hora).

## Correcao

Adicionar uma variavel `useRef` como guard para garantir que o `handleCallback` seja chamado **apenas uma vez**, mesmo que o `useEffect` dispare multiplas vezes.

## Arquivo a ser modificado

**`src/components/GoogleCalendarConnect.tsx`**

Adicionar:
- `import { useEffect, useRef }` no lugar de `import { useEffect }`
- `const callbackProcessed = useRef(false)` para controlar se o callback ja foi processado
- Verificar `if (!callbackProcessed.current)` antes de chamar `handleCallback`
- Setar `callbackProcessed.current = true` imediatamente ao entrar no bloco

Isso impede que chamadas duplicadas acontecam, eliminando o toast de erro.

## Resultado esperado

Ao conectar o Google Calendar, voce vera apenas o tick verde "Conectado ao Google Calendar" sem nenhuma mensagem de erro.

## Nota importante

Sua conexao ja esta funcionando. Se voce recarregar a pagina do calendario agora, vera que o Google Calendar esta conectado normalmente. Esta correcao e apenas para eliminar a mensagem de erro falsa que aparece durante o processo de conexao.

