

# Plano de Correcao: Problema de Indexacao "Pagina com Redirecionamento"

## Diagnostico do Problema

O Google Search Console esta reportando problemas de **"Pagina com redirecionamento"** no site rafaelegg.com. Apos analise detalhada do codigo, identifiquei as seguintes causas:

---

## PROBLEMAS ENCONTRADOS

### 1. Rota `/configuracoes` Redireciona para `/404` (PROBLEMA PRINCIPAL)

**Arquivo**: `src/App.tsx` (linhas 45-59 e 77-80)

```text
Rota publica "/configuracoes" → RedirectGoogleCalendarCallbackToAdminCalendar()
  → Se NAO tem parametro "code=" → Navigate to "/404"
```

**Problema**: O Google tenta indexar `/configuracoes` (que esta no robots.txt como Disallow), mas essa pagina faz um redirect JavaScript para `/404`. O Google detecta isso como uma **cadeia de redirecionamento**.

**Solucao**: Remover essa rota publica completamente. O callback do Google Calendar deve usar apenas a rota interna `/metodo-idea/configuracoes`.

### 2. URLs com `www.` nos Templates de Mensagem

**Arquivos afetados**:
- `supabase/functions/schedule-evento-followups/index.ts`
- `supabase/migrations/20260119070853_...sql`

**Problema**: Algumas mensagens e configuracoes usam `www.rafaelegg.com` que e redirecionado 301 para `rafaelegg.com`. Se o Google segue esses links, ve uma cadeia de redirect.

**Solucao**: Padronizar todas as URLs internas para usar `https://rafaelegg.com/` sem www.

### 3. Redirect de www → non-www no `_redirects`

**Arquivo**: `public/_redirects`

**Status**: Este redirect esta CORRETO (301 permanente). Porem, se houver links com www no sitemap ou conteudo, o Google pode reportar como problema.

**Verificacao**: O sitemap.xml esta correto, usando apenas `https://rafaelegg.com/`.

---

## SOLUCAO PROPOSTA

### Arquivo 1: `src/App.tsx`

**Mudanca**: Remover a rota publica `/configuracoes` que causa redirect para 404.

```text
ANTES:
Route path="/configuracoes" → RedirectGoogleCalendarCallbackToAdminCalendar

DEPOIS:
(rota removida - o OAuth do Google Calendar usa /metodo-idea/calendario diretamente)
```

### Arquivo 2: `src/hooks/useGoogleCalendar.tsx`

**Mudanca**: Atualizar o redirect URI do OAuth para apontar diretamente para a rota interna.

```text
ANTES:
return `${base}/configuracoes?google_callback=true`;

DEPOIS:
return `${base}/metodo-idea/calendario?google_callback=true`;
```

**Importante**: Apos essa mudanca, voce precisara atualizar a configuracao do OAuth no Google Cloud Console para adicionar a nova URI de redirecionamento autorizada.

### Arquivo 3: `supabase/functions/schedule-evento-followups/index.ts`

**Mudanca**: Padronizar URLs sem www.

```text
ANTES:
www.rafaelegg.com/consultoria

DEPOIS:
https://rafaelegg.com/consultoria
```

### Arquivo 4: `public/robots.txt`

**Verificacao**: Confirmar que `/configuracoes` e `/404` estao bloqueados.

```text
# Ja existente - manter:
Disallow: /configuracoes

# ADICIONAR:
Disallow: /404
```

---

## ARQUIVOS A MODIFICAR

| Arquivo | Acao | Impacto |
|---------|------|---------|
| `src/App.tsx` | Remover rota `/configuracoes` publica | Elimina redirect chain |
| `src/hooks/useGoogleCalendar.tsx` | Atualizar redirect URI | Necessario para OAuth funcionar |
| `supabase/functions/schedule-evento-followups/index.ts` | Padronizar URLs | Evita redirects em links de mensagens |
| `public/robots.txt` | Bloquear `/404` | Impede indexacao da pagina 404 |

---

## SECAO TECNICA

### Mudanca em `src/App.tsx`

Remover as linhas 45-59 e 77-80:

```tsx
// REMOVER este bloco de funcao:
function RedirectGoogleCalendarCallbackToAdminCalendar() {
  const location = useLocation();
  if (!location.search.includes('code=')) {
    return <Navigate to="/404" replace />;
  }
  return (
    <Navigate
      to={`/metodo-idea/calendario${location.search}${location.hash}`}
      replace
    />
  );
}

// REMOVER esta rota:
<Route
  path="/configuracoes"
  element={<RedirectGoogleCalendarCallbackToAdminCalendar />}
/>
```

### Mudanca em `src/hooks/useGoogleCalendar.tsx`

Linha 54:

```tsx
// ANTES:
return `${base}/configuracoes?google_callback=true`;

// DEPOIS:
return `${base}/metodo-idea/calendario?google_callback=true`;
```

### Mudanca em `schedule-evento-followups/index.ts`

Linhas 22, 39, 52:

```ts
// ANTES:
www.rafaelegg.com/consultoria

// DEPOIS:
https://rafaelegg.com/consultoria
```

### Mudanca em `public/robots.txt`

Adicionar apos linha 21:

```text
Disallow: /404
```

---

## ACAO POS-IMPLEMENTACAO

1. **Google Cloud Console**: Atualizar as URIs de redirecionamento autorizadas:
   - Remover: `https://crmidea.lovable.app/configuracoes`
   - Adicionar: `https://crmidea.lovable.app/metodo-idea/calendario`

2. **Google Search Console**: 
   - Acessar "Indexacao > Paginas"
   - Localizar o problema "Pagina com redirecionamento"
   - Clicar em "Validar correcao" apos o deploy

3. **Aguardar**: O Google leva alguns dias para reprocessar as URLs

---

## IMPACTO ESPERADO

- O Google nao vera mais redirects em `/configuracoes`
- As mensagens de WhatsApp nao terao links que redirecionam
- A pagina 404 sera ignorada pelo Google
- O erro de indexacao deve ser resolvido na proxima validacao

