import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE_URL = "https://rafaelegg.com";

const BOT_PATTERNS = [
  "googlebot", "bingbot", "msnbot", "yandexbot",
  "facebot", "facebookexternalhit", "linkedinbot", "twitterbot",
  "slackbot", "whatsapp", "telegrambot",
  "perplexitybot", "gptbot", "claude-web", "anthropic-ai",
  "google-extended", "bytespider", "applebot",
  "duckduckbot", "semrushbot", "ahrefsbot",
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(bot => ua.includes(bot));
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function markdownToHtml(md: string): string {
  let html = md;
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  html = html.replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>");
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*<(h[1-3]|ul|ol|li)/g, "<$1");
  html = html.replace(/<\/(h[1-3]|ul|ol|li)>\s*<\/p>/g, "</$1>");
  return html;
}

function baseHtml(title: string, description: string, canonicalPath: string, content: string, jsonLd: object, ogImage = `${SITE_URL}/og-image.png`): string {
  const canonical = `${SITE_URL}${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Rafael Egg - IA para Advogados">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" type="image/png" href="/favicon.png">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1a1a1a;line-height:1.7}nav a{margin-right:16px;color:#F5A524;text-decoration:none}h1{color:#1a1a1a;font-size:2em}h2{color:#333;margin-top:1.5em}article{margin:2em 0}footer{margin-top:3em;padding-top:1em;border-top:1px solid #eee;color:#666;font-size:0.9em}.blog-card{border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin:16px 0}.blog-card h3 a{color:#F5A524;text-decoration:none}</style>
</head>
<body>
<header>
<nav>
<a href="/" aria-label="Início"><strong>Rafael Egg</strong></a>
<a href="/blog">Blog</a>
<a href="/consultoria">Consultoria</a>
<a href="/consultoria/economia">Economia com IA</a>
<a href="/bio">Bio</a>
</nav>
</header>
<main>
${content}
</main>
<footer>
<p>&copy; ${new Date().getFullYear()} Rafael Egg - Especialista em IA para Advogados</p>
<p><a href="/blog">Blog</a> | <a href="/consultoria">Consultoria IDEA</a> | <a href="/bio">Bio</a> | <a href="/privacidade">Privacidade</a></p>
</footer>
</body>
</html>`;
}

async function renderHomePage(): Promise<string> {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Rafael Egg",
    "url": SITE_URL,
    "jobTitle": "Especialista em IA para Advogados",
    "description": "Consultoria, mentoria e cursos de inteligência artificial aplicada à advocacia.",
    "sameAs": ["https://instagram.com/rafael.egg", "https://youtube.com/@rafaelegg"]
  };

  const content = `
<h1>Rafael Egg - Inteligência Artificial para Advogados</h1>
<p>Especialista em <strong>inteligência artificial aplicada à advocacia</strong>. Ajudo advogados e escritórios a transformarem sua prática jurídica com IA, aumentando produtividade e resultados.</p>

<section>
<h2>Produtos e Serviços</h2>

<div class="blog-card">
<h3>🎯 Consultoria IDEA</h3>
<p>Consultoria personalizada de implementação de IA no seu escritório de advocacia. Diagnóstico completo, plano de ação e acompanhamento.</p>
<p><a href="/consultoria">Saiba mais sobre a Consultoria IDEA →</a></p>
</div>

<div class="blog-card">
<h3>🎓 Curso IDEA</h3>
<p>Curso completo de IA para advogados: do básico ao avançado, incluindo tráfego pago, orgânico, IA no setor comercial e operacional.</p>
</div>

<div class="blog-card">
<h3>📖 Guia Prático de IA</h3>
<p>E-book com técnicas práticas para advogados que querem começar a usar inteligência artificial no dia a dia.</p>
</div>

<div class="blog-card">
<h3>💡 Código de Prompts</h3>
<p>Coletânea de prompts jurídicos otimizados para ChatGPT, Claude e outras IAs.</p>
</div>
</section>

<section>
<h2>Perguntas Frequentes</h2>
<h3>A IA vai substituir os advogados?</h3>
<p>Não. A IA é uma ferramenta que potencializa o trabalho do advogado. Advogados que usam IA terão vantagem sobre os que não usam.</p>
<h3>Preciso saber programar para usar IA?</h3>
<p>Não. As ferramentas de IA atuais são intuitivas e não exigem conhecimento técnico de programação.</p>
<h3>A Consultoria IDEA é para qual tipo de advogado?</h3>
<p>Para qualquer advogado ou escritório que queira implementar inteligência artificial de forma estratégica e personalizada.</p>
</section>

<section>
<h2>Artigos Recentes</h2>
<p>Confira os artigos mais recentes no <a href="/blog">Blog sobre IA na Advocacia</a>.</p>
</section>`;

  return baseHtml(
    "Rafael Egg - IA para Advogados | Consultoria e Cursos",
    "Especialista em Inteligência Artificial para Advogados. Consultoria IDEA, Mentoria, Cursos e E-books para transformar sua advocacia com IA.",
    "/",
    content,
    jsonLd
  );
}

async function renderBlogList(supabaseClient: any): Promise<string> {
  const { data: posts } = await supabaseClient
    .from("blog_posts")
    .select("slug, title, excerpt, category, published_at, read_time_minutes, cover_image_url")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  let postsList = "";
  if (posts && posts.length > 0) {
    for (const post of posts) {
      const date = new Date(post.published_at).toLocaleDateString("pt-BR");
      postsList += `
<div class="blog-card">
<h3><a href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h3>
<p><small>${date} · ${post.read_time_minutes || 5} min de leitura · ${escapeHtml(post.category || "IA")}</small></p>
<p>${escapeHtml(post.excerpt || "")}</p>
<p><a href="/blog/${escapeHtml(post.slug)}">Ler artigo completo →</a></p>
</div>`;
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog sobre IA na Advocacia - Rafael Egg",
    "url": `${SITE_URL}/blog`,
    "description": "Artigos sobre inteligência artificial aplicada ao direito e à advocacia.",
    "author": { "@type": "Person", "name": "Rafael Egg" },
    "blogPost": (posts || []).map((p: any) => ({
      "@type": "BlogPosting",
      "headline": p.title,
      "url": `${SITE_URL}/blog/${p.slug}`,
      "description": p.excerpt,
      "datePublished": p.published_at,
      "author": { "@type": "Person", "name": "Rafael Egg" }
    }))
  };

  return baseHtml(
    "Blog IA na Advocacia | Rafael Egg",
    "Artigos sobre inteligência artificial aplicada à advocacia. Aprenda a usar IA para aumentar produtividade, automatizar tarefas e melhorar resultados.",
    "/blog",
    `<h1>Blog: Inteligência Artificial na Advocacia</h1>
<p>Artigos práticos sobre como usar IA para transformar sua prática jurídica.</p>
${postsList}`,
    jsonLd
  );
}

async function renderBlogPost(supabaseClient: any, slug: string): Promise<string | null> {
  const { data: post } = await supabaseClient
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) return null;

  const { data: relatedPosts } = await supabaseClient
    .from("blog_posts")
    .select("slug, title")
    .eq("is_published", true)
    .neq("slug", slug)
    .limit(3);

  const date = new Date(post.published_at).toLocaleDateString("pt-BR");
  const contentHtml = markdownToHtml(post.content);

  let relatedHtml = "";
  if (relatedPosts && relatedPosts.length > 0) {
    relatedHtml = `<section><h2>Artigos Relacionados</h2><ul>${relatedPosts.map((r: any) => `<li><a href="/blog/${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a></li>`).join("")}</ul></section>`;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "url": `${SITE_URL}/blog/${post.slug}`,
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "author": { "@type": "Person", "name": "Rafael Egg", "url": SITE_URL },
    "publisher": { "@type": "Person", "name": "Rafael Egg" },
    "image": post.cover_image_url ? `${SITE_URL}${post.cover_image_url}` : `${SITE_URL}/og-image.png`,
    "mainEntityOfPage": `${SITE_URL}/blog/${post.slug}`,
    "wordCount": post.content.split(/\s+/).length,
    "timeRequired": `PT${post.read_time_minutes || 5}M`
  };

  const ogImage = post.cover_image_url ? `${SITE_URL}${post.cover_image_url}` : `${SITE_URL}/og-image.png`;

  return baseHtml(
    `${post.title} | Rafael Egg`,
    post.excerpt || post.title,
    `/blog/${post.slug}`,
    `<article>
<h1>${escapeHtml(post.title)}</h1>
<p><small>Por Rafael Egg · ${date} · ${post.read_time_minutes || 5} min de leitura · ${escapeHtml(post.category || "IA")}</small></p>
${contentHtml}
</article>
${relatedHtml}
<p><a href="/blog">← Voltar para o Blog</a></p>`,
    jsonLd,
    ogImage
  );
}

function renderConsultingPage(): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Consultoria IDEA - IA para Advogados",
    "provider": { "@type": "Person", "name": "Rafael Egg", "url": SITE_URL },
    "description": "Consultoria personalizada de implementação de inteligência artificial em escritórios de advocacia.",
    "url": `${SITE_URL}/consultoria`,
    "areaServed": "BR",
    "serviceType": "Consultoria em Inteligência Artificial"
  };

  return baseHtml(
    "Consultoria IDEA - IA para Advogados | Rafael Egg",
    "Consultoria personalizada de implementação de IA na advocacia. Diagnóstico, plano de ação, acompanhamento e mais de 40 funcionalidades de IA para seu escritório.",
    "/consultoria",
    `<h1>Consultoria IDEA - Implementação de IA na Advocacia</h1>
<p>A <strong>Consultoria IDEA</strong> é um programa completo e personalizado de implementação de inteligência artificial no seu escritório de advocacia.</p>

<h2>O Que Você Recebe</h2>
<ul>
<li><strong>Diagnóstico completo</strong> do seu escritório</li>
<li><strong>Plano de implementação</strong> personalizado</li>
<li><strong>Acompanhamento individual</strong> por 3 meses</li>
<li><strong>+40 funcionalidades de IA</strong> configuradas</li>
<li><strong>Acesso ao Curso IDEA</strong> completo</li>
<li><strong>Suporte via WhatsApp</strong> direto com Rafael Egg</li>
</ul>

<h2>Áreas de Implementação</h2>
<ul>
<li>Automação de documentos e contratos</li>
<li>Pesquisa jurídica com IA</li>
<li>Atendimento ao cliente inteligente</li>
<li>Marketing jurídico com IA</li>
<li>Gestão financeira automatizada</li>
<li>Prospecção e captação de clientes</li>
<li>Tráfego pago e orgânico</li>
<li>IA no setor comercial e operacional</li>
</ul>

<h2>Resultados Esperados</h2>
<ul>
<li>Redução de até 70% no tempo de tarefas repetitivas</li>
<li>Aumento de produtividade de 3x a 5x</li>
<li>Economia de R$ 5.000 a R$ 15.000/mês em horas de trabalho</li>
</ul>

<p><a href="/consultoria/economia">Veja a calculadora de economia com IA →</a></p>
<p><a href="https://instagram.com/rafael.egg">Entre em contato pelo Instagram →</a></p>`,
    jsonLd
  );
}

function renderEconomyPage(): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Economia com IA na Advocacia - Calculadora",
    "url": `${SITE_URL}/consultoria/economia`,
    "description": "Descubra quanto seu escritório pode economizar com inteligência artificial."
  };

  return baseHtml(
    "Economia com IA na Advocacia | Consultoria IDEA",
    "Descubra quanto seu escritório pode economizar com inteligência artificial. Calculadora de economia por área de atuação.",
    "/consultoria/economia",
    `<h1>Quanto Seu Escritório Pode Economizar com IA?</h1>
<p>A implementação de inteligência artificial na advocacia gera economia significativa em diversas áreas:</p>

<h2>Áreas de Economia</h2>

<h3>📄 Automação de Documentos</h3>
<p>Economia de 34 a 50 horas/mês · R$ 5.175 a R$ 7.575/mês</p>

<h3>🔍 Pesquisa Jurídica</h3>
<p>Economia de 26 a 39 horas/mês · R$ 3.900 a R$ 5.850/mês</p>

<h3>💬 Atendimento ao Cliente</h3>
<p>Economia de 22 a 34 horas/mês · R$ 3.300 a R$ 5.100/mês</p>

<h3>📊 Marketing Jurídico</h3>
<p>Economia de 18 a 28 horas/mês · R$ 2.700 a R$ 4.200/mês</p>

<h3>💰 Gestão Financeira</h3>
<p>Economia de 12 a 20 horas/mês · R$ 1.800 a R$ 3.000/mês</p>

<h2>Economia Total Potencial</h2>
<p><strong>112 a 171 horas/mês</strong> economizadas</p>
<p><strong>R$ 16.875 a R$ 25.725/mês</strong> em valor</p>
<p><strong>R$ 202.500 a R$ 308.700/ano</strong></p>

<p><a href="/consultoria">Conheça a Consultoria IDEA →</a></p>`,
    jsonLd
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";
    const userAgent = req.headers.get("user-agent") || "";
    const forcePrerender = url.searchParams.get("force") === "true";

    // Only serve prerendered HTML for bots (or if force=true for testing)
    if (!isBot(userAgent) && !forcePrerender) {
      return new Response(JSON.stringify({ prerender: false, reason: "not a bot" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let html: string | null = null;

    if (path === "/" || path === "") {
      html = await renderHomePage();
    } else if (path === "/blog") {
      html = await renderBlogList(supabaseClient);
    } else if (path.startsWith("/blog/")) {
      const slug = path.replace("/blog/", "").replace(/\/$/, "");
      if (slug) {
        html = await renderBlogPost(supabaseClient, slug);
      }
    } else if (path === "/consultoria") {
      html = renderConsultingPage();
    } else if (path === "/consultoria/economia") {
      html = renderEconomyPage();
    } else if (path === "/faq") {
      html = renderFAQPage();
    }

    if (!html) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Prerender error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
