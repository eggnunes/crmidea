

# Correção: Campo "FAQPage" Duplicado nos Dados Estruturados

## Problema

O Google Search Console detectou que o schema `FAQPage` está duplicado na página inicial (`rafaelegg.com`). Isso é um **problema crítico** que impede a página de aparecer nos resultados de pesquisa.

**Causa raiz**: Existem duas fontes injetando JSON-LD no HTML:

1. **Vite SEO Plugin** (`vite-plugin-seo.ts`): Injeta schemas no HTML durante o build, incluindo o `faqSchema` (sem classe CSS identificadora)
2. **SEOHead component** (`useEffect`): Limpa apenas elementos com classe `seo-jsonld` e re-injeta schemas do React

O plugin de build não adiciona a classe `seo-jsonld` aos scripts, então o SEOHead não consegue removê-los. Resultado: dois blocos `FAQPage` no HTML final.

## Solução

Atualizar o **SEOHead component** para limpar TODOS os `<script type="application/ld+json">` do `<head>` antes de injetar os novos, independentemente de terem ou não a classe `seo-jsonld`. Isso garante que os schemas injetados pelo Vite plugin no build sejam substituídos pelos do React quando a página hidrata.

### Arquivo: `src/components/seo/SEOHead.tsx`

Alterar a lógica de limpeza de JSON-LD de:
```javascript
document.querySelectorAll(`.${JSONLD_CLASS}`).forEach((el) => el.remove());
```
Para:
```javascript
document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
```

Isso remove tanto os scripts injetados pelo plugin (sem classe) quanto os injetados anteriormente pelo SEOHead (com classe), antes de inserir os novos.

### Arquivo: `src/pages/HomePage.tsx`

Adicionar o prop `schemaJson` ao `SEOHead` da homepage com os schemas corretos (Person, Organization, Website, FAQ, Breadcrumb) para que, ao hidratar, o React re-injete apenas UMA cópia de cada schema. Atualmente a HomePage não passa `schemaJson`, então nenhum JSON-LD é injetado pelo React, mas os do build permanecem (incluindo o FAQ duplicado se houver cache).

### Impacto

- Os schemas injetados pelo Vite plugin continuam funcionando para crawlers que não executam JavaScript (pré-renderização)
- Quando o React monta, ele limpa tudo e injeta uma cópia limpa
- Sem duplicação para crawlers que executam JavaScript (como o Googlebot)

