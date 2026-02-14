

# Plano: Pre-rendering para SEO - Fazer o Google Indexar o Site

## O Problema

O site e construido em React (JavaScript). Quando o Google visita uma pagina, ele recebe um HTML praticamente vazio:

```text
<div id="root"></div>
<script src="/src/main.tsx"></script>
```

O Google precisa:
1. Baixar o JavaScript (~500KB+)
2. Executar o React
3. Esperar chamadas ao banco de dados (blog posts, etc.)
4. So entao "ver" o conteudo

Na pratica, o Google frequentemente desiste antes de completar esse processo, especialmente para conteudo que depende de chamadas a APIs.

## A Solucao: Pre-rendering com Edge Function

Criar uma funcao no backend que detecta quando um **bot de busca** (Googlebot, Bingbot, etc.) acessa o site e serve uma versao **HTML estatica pre-renderizada** das paginas publicas importantes, com todo o conteudo ja inserido no HTML.

Usuarios normais continuam recebendo o site React normal.

```text
Visitante normal  -->  index.html (React SPA)  -->  Experiencia interativa
Googlebot         -->  HTML estatico completo   -->  Conteudo indexavel
```

## Paginas que serao pre-renderizadas

1. **Pagina inicial** (`/`) - Apresentacao, produtos, FAQ
2. **Blog - listagem** (`/blog`) - Lista de todos os artigos
3. **Blog - cada artigo** (`/blog/:slug`) - Conteudo completo do artigo
4. **Consultoria** (`/consultoria`) - Pagina de vendas da consultoria
5. **Consultoria economia** (`/consultoria/economia`)

## Etapas de Implementacao

### 1. Criar Edge Function "prerender-page"

Uma funcao backend que:
- Recebe o caminho da pagina (ex: `/blog/ia-revolucionando-advocacia-2025`)
- Busca os dados necessarios no banco (titulo, conteudo, meta tags)
- Gera HTML completo com todo o conteudo, meta tags, dados estruturados (JSON-LD), Open Graph
- Retorna esse HTML para o bot

### 2. Criar Edge Function "bot-detector"

Uma funcao que:
- Analisa o User-Agent da requisicao
- Detecta bots: Googlebot, Bingbot, Yandex, PerplexityBot, GPTBot, etc.
- Se for bot: redireciona para a versao pre-renderizada
- Se for usuario normal: serve o SPA React normalmente

### 3. Templates HTML estaticos

Para cada tipo de pagina, sera criado um template HTML com:
- Tags `<title>` e `<meta description>` corretas
- Open Graph e Twitter Cards
- Dados estruturados JSON-LD (Schema.org)
- Conteudo textual completo visivel no HTML
- Tags semanticas (`<article>`, `<h1>`, `<h2>`, `<nav>`, `<main>`, `<footer>`)
- Links internos entre paginas

### 4. Conteudo dinamico do blog

Para artigos do blog, a funcao vai:
- Consultar o banco de dados para obter o artigo pelo slug
- Renderizar o conteudo Markdown como HTML
- Inserir no template com todas as meta tags corretas
- Incluir links para artigos relacionados (link building interno)

### 5. Atualizacao do robots.txt

Simplificar e otimizar o robots.txt para garantir acesso completo dos bots as paginas publicas.

### 6. Atualizacao do sitemap.xml

Gerar o sitemap dinamicamente a partir dos artigos do banco de dados, para que novos artigos sejam automaticamente incluidos.

## Detalhes Tecnicos

### Estrutura das Edge Functions

```text
supabase/functions/
  prerender/index.ts        -- Funcao principal que gera HTML para bots
```

### Deteccao de bots (dentro da funcao)

A funcao verifica o header User-Agent para identificar:
- Googlebot, Googlebot-Mobile
- Bingbot, MSNBot
- YandexBot
- Facebot (Facebook crawler)
- LinkedInBot
- Twitterbot
- PerplexityBot, GPTBot, Claude-Web

### HTML gerado (exemplo para artigo do blog)

O HTML gerado tera a estrutura completa com conteudo real, nao depende de JavaScript:

```text
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <title>Titulo do Artigo | Rafael Egg</title>
  <meta name="description" content="...">
  <meta property="og:title" content="...">
  <script type="application/ld+json">{ dados estruturados }</script>
</head>
<body>
  <header><nav>...</nav></header>
  <main>
    <article>
      <h1>Titulo do Artigo</h1>
      <p>Conteudo completo do artigo em HTML puro...</p>
    </article>
  </main>
  <footer>...</footer>
</body>
</html>
```

### Integracao com o frontend

Adicionar no `index.html` uma tag `<noscript>` com conteudo basico para crawlers que nao executam JavaScript, e meta tags adicionais para melhorar a indexacao.

## Resultado Esperado

- O Google vai conseguir ler **todo o conteudo** do site sem precisar executar JavaScript
- Artigos do blog serao indexados com titulo, descricao e conteudo completo
- A pagina de consultoria aparecera nos resultados de busca
- Dados estruturados (JSON-LD) serao lidos corretamente
- Novos artigos do blog serao automaticamente indexaveis

## Proximos Passos Apos Implementacao

1. Reenviar o sitemap no Google Search Console
2. Solicitar re-indexacao das paginas principais
3. Aguardar 2-4 semanas para o Google processar as mudancas
4. Monitorar o Google Search Console para verificar melhoria na cobertura

