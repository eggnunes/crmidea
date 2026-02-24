

# Correção Definitiva: FAQPage Duplicado no Google Search Console

## Diagnóstico

O problema persiste porque existem **duas fontes diferentes** gerando schemas `FAQPage` para a mesma URL `https://rafaelegg.com/`:

1. **Build-time** (`src/data/seoRoutes.ts`, linha 330): O Vite plugin injeta um `faqSchema` com 6 perguntas sobre IA na advocacia no HTML estático
2. **Runtime** (`src/pages/HomePage.tsx`, linha 229): O React injeta outro `FAQPage` via `generateFAQSchema(faqItems)` com perguntas diferentes sobre produtos/serviços

O Google indexa o HTML estático **antes** do JavaScript executar, então vê o FAQ do build. Quando o JS executa, o SEOHead limpa e re-injeta — mas o Googlebot pode já ter capturado ambos, ou renderizar e ver a transição.

## Solução

Remover o `faqSchema` da array `jsonLd` no `seoRoutes.ts` para a rota `/`. Assim, apenas UMA fonte (o React no HomePage) injeta o `FAQPage`. O HTML estático do build continuará com Person, Organization, Website e Breadcrumb — sem FAQ duplicado.

### Alteração única

**Arquivo: `src/data/seoRoutes.ts`** — linha 330

De:
```typescript
jsonLd: [personSchema, organizationSchema, websiteSchema, faqSchema, breadcrumb()],
```

Para:
```typescript
jsonLd: [personSchema, organizationSchema, websiteSchema, breadcrumb()],
```

Isso remove a injeção do FAQ no build, eliminando a duplicação. O `faqSchema` continuará definido no arquivo (pode ser usado futuramente), mas não será injetado na homepage pelo plugin.

### Após a correção

1. Publicar o site
2. No Google Search Console, clicar em "VALIDAR A CORREÇÃO"
3. Aguardar o Google re-rastrear (pode levar alguns dias)

