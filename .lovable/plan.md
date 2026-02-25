

# Plano: Remover Injeção de JSON-LD do React (Manter apenas Pre-rendering)

## Problema
O serviço de pre-rendering (LovableHTML) já injeta os dados estruturados JSON-LD no HTML servido aos bots. O React também injeta os mesmos schemas via `SEOHead`, causando duplicação que o Google detecta.

## Alterações

### 1. `src/components/seo/SEOHead.tsx`
- Remover toda a lógica de JSON-LD (linhas 77-87): eliminar o bloco que remove e re-injeta scripts `application/ld+json`
- Remover a prop `schemaJson` da interface e do componente
- Manter todas as meta tags (title, description, OG, Twitter, canonical, robots)

### 2. `src/pages/HomePage.tsx`
- Remover a prop `schemaJson={[...]}` do componente `<SEOHead>` (linhas 214-233)
- Remover os imports não utilizados de `JsonLd.tsx`: `personSchema`, `organizationSchema`, `generateFAQSchema`, `generateBreadcrumbSchema`

### 3. `src/pages/BlogArticlePage.tsx`
- Remover a prop `schemaJson={[articleSchema, breadcrumbSchema]}` do `<SEOHead>`
- Remover variáveis e imports relacionados aos schemas (se ficarem sem uso)

### Arquivos NÃO alterados
- `src/components/seo/JsonLd.tsx` — mantido como está (pode ser útil futuramente)
- `src/data/seoRoutes.ts` — mantido (usado pelo pre-rendering)
- Nenhuma meta tag será removida
- Nenhum comentário HTML será alterado

## Resumo técnico
Três arquivos serão modificados. A única mudança é parar de injetar `<script type="application/ld+json">` via JavaScript no runtime, delegando isso 100% ao serviço de pre-rendering.

