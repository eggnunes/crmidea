
# Plano: Enriquecer o HTML Estatico para SEO (Sem Proxy)

## Estrategia

Como nao vamos usar proxy/redirect, a abordagem sera colocar **conteudo real diretamente no `index.html`** que o Google consegue ler imediatamente, antes de qualquer JavaScript carregar. Quando o React monta, ele substitui esse conteudo pelo SPA interativo.

Alem disso, vamos adicionar **dados estruturados (JSON-LD)** diretamente no `<head>` do HTML, garantindo que o Google entenda exatamente o que o site oferece.

## O Que Vai Mudar

### 1. Conteudo HTML real no `index.html` (antes do React montar)

Vamos adicionar um bloco de conteudo HTML semantico **dentro do `<div id="root">`**. Isso e importante porque:
- O Google ve esse conteudo imediatamente ao acessar a pagina
- Quando o React monta, ele substitui tudo dentro do `#root` pelo SPA
- Usuarios normais nunca verao esse conteudo (React carrega rapido)
- NAO fica dentro de `<noscript>` - fica visivel para TODOS os crawlers

O conteudo incluira:
- Apresentacao do Rafael Egg
- Lista de produtos e servicos (Consultoria, Mentoria, Curso, E-books)
- Perguntas frequentes (FAQ) com respostas completas
- Links para todos os artigos do blog
- Links para paginas de consultoria e economia
- Resultados e numeros (500+ advogados, 50+ escritorios, etc.)

### 2. JSON-LD direto no `<head>` do `index.html`

Adicionar schemas estruturados diretamente no HTML estatico:
- **Person** (Rafael Egg)
- **Organization** (Rafael Egg - IA para Advogados)
- **WebSite** (com SearchAction)
- **FAQPage** (perguntas frequentes)
- **Service** (Consultoria IDEA)
- **SiteNavigationElement** (links de navegacao)

### 3. Melhorar a tag `<noscript>`

Expandir o conteudo da tag `<noscript>` com mais informacoes, ja que alguns crawlers podem nao executar JS e dependem dela.

### 4. Atualizar o `llm.html`

Atualizar o ano e manter os links dos artigos reais do banco de dados.

## Detalhes Tecnicos

### Conteudo dentro de `<div id="root">`

O React, ao montar via `ReactDOM.createRoot(document.getElementById('root')!).render(...)`, substitui automaticamente qualquer conteudo que esteja dentro do `#root`. Portanto, colocar HTML estatico ali e seguro: o Google le antes do JS, e o usuario ve o SPA normal.

### Arquivos que serao modificados

1. **`index.html`** - Adicionar conteudo HTML semantico dentro do `#root`, JSON-LD no `<head>`, e expandir o `<noscript>`
2. **`public/llm.html`** - Atualizar com artigos reais e ano correto

### Exemplo da estrutura do conteudo no `#root`

```text
<div id="root">
  <div id="seo-content">
    <header>
      <h1>Rafael Egg - IA para Advogados</h1>
      <nav>Links para Blog, Consultoria, Bio, etc.</nav>
    </header>
    <main>
      <section>Sobre Rafael Egg + credenciais</section>
      <section>Produtos e servicos com links</section>
      <section>Artigos do blog com links</section>
      <section>FAQ completo</section>
    </main>
    <footer>Links e informacoes de contato</footer>
  </div>
</div>
```

O conteudo tera estilos basicos inline para que, caso algum usuario veja antes do React carregar, a experiencia nao seja ruim.

## Resultado Esperado

- Google conseguira ler conteudo rico e completo sem executar JavaScript
- Palavras-chave como "IA para advogados", "consultoria IA advocacia", "ChatGPT advogados" estarao no HTML estatico
- FAQ aparecera como rich snippet nos resultados de busca
- Links internos entre paginas serao rastreados pelo Google
- Dados estruturados serao lidos na primeira passada do crawler
