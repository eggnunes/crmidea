// Single source of truth for all public SEO routes
export interface SEORouteData {
  path: string;
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  h1: string;
  staticContent: string;
  noscriptContent: string;
  jsonLd: object[];
  lastModified: string;
  sitemapPriority: number;
  changeFrequency: string;
}

const BASE_URL = "https://rafaelegg.com";
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const TODAY = "2026-02-23";

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Rafael Egg",
  "alternateName": "Rafael Egg Nunes",
  "jobTitle": "Mentor em IA para Advocacia",
  "description": "Advogado desde 2008, especialista em Inteligência Artificial para escritórios de advocacia. Criador do Método IDEA. Premiado como Melhor Escritório em IA do Brasil 2025 pela Law Summit.",
  "url": BASE_URL,
  "image": OG_IMAGE,
  "sameAs": [
    "https://www.instagram.com/rafaeleggnunes/",
    "https://www.tiktok.com/@rafaeleggnunes",
    "https://youtube.com/@rafaeleggnunes",
    "https://www.linkedin.com/in/rafaeleggnunes/"
  ],
  "knowsAbout": ["Inteligência Artificial", "Advocacia", "Automação Jurídica", "ChatGPT para Advogados", "Produtividade Jurídica", "Legal Tech"],
  "award": "Melhor Escritório em IA do Brasil 2025 - Law Summit"
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Rafael Egg - IA para Advogados",
  "url": BASE_URL,
  "logo": OG_IMAGE,
  "description": "Consultoria, mentoria e cursos de Inteligência Artificial para advogados e escritórios de advocacia.",
  "founder": { "@type": "Person", "name": "Rafael Egg" },
  "sameAs": [
    "https://www.instagram.com/rafaeleggnunes/",
    "https://www.tiktok.com/@rafaeleggnunes",
    "https://youtube.com/@rafaeleggnunes"
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Rafael Egg - IA para Advogados",
  "url": BASE_URL,
  "description": "Consultoria, mentoria e cursos de Inteligência Artificial para advogados.",
  "inLanguage": "pt-BR",
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${BASE_URL}/blog?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Preciso saber programar para usar IA na advocacia?", "acceptedAnswer": { "@type": "Answer", "text": "Não. Todos os produtos e metodologias do Rafael Egg são projetados para advogados de qualquer nível técnico. Não é necessário conhecimento em programação." } },
    { "@type": "Question", "name": "O uso de IA na advocacia é ético?", "acceptedAnswer": { "@type": "Answer", "text": "Sim, quando usado corretamente. A OAB permite o uso de ferramentas de IA como apoio ao trabalho advocatício, desde que o advogado mantenha a responsabilidade técnica e revise todo o conteúdo gerado." } },
    { "@type": "Question", "name": "Qual a melhor IA para advogados?", "acceptedAnswer": { "@type": "Answer", "text": "ChatGPT, Claude e Gemini são as mais usadas. Cada uma tem vantagens específicas. Na Consultoria e Mentoria, ensinamos a usar todas de forma estratégica para diferentes tarefas jurídicas." } },
    { "@type": "Question", "name": "Como usar o ChatGPT para escrever petições?", "acceptedAnswer": { "@type": "Answer", "text": "É necessário usar prompts bem estruturados com contexto, tipo de peça, estilo desejado e informações do caso. No Código dos Prompts, ensinamos exatamente como criar prompts jurídicos eficientes." } },
    { "@type": "Question", "name": "A IA vai substituir os advogados?", "acceptedAnswer": { "@type": "Answer", "text": "Não. A IA é uma ferramenta que potencializa o trabalho do advogado. Profissionais que dominam a tecnologia terão vantagem competitiva significativa sobre os que não usam." } },
    { "@type": "Question", "name": "O que é o Método IDEA?", "acceptedAnswer": { "@type": "Answer", "text": "O Método IDEA (Inteligência de Dados e Artificial) é uma metodologia exclusiva criada por Rafael Egg para ajudar advogados a automatizar rotinas, captar mais clientes, escalar faturamento e usar IA de forma ética e eficiente." } }
  ]
};

function breadcrumb(...items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Início", "item": `${BASE_URL}/` },
      ...items.map((item, i) => ({ "@type": "ListItem", "position": i + 2, "name": item.name, "item": item.url }))
    ]
  };
}

// ─── Blog post data ───
export const blogPostsSEO: SEORouteData[] = [
  {
    path: "/blog/futuro-advocacia-ia-previsoes-2030",
    title: "Futuro da Advocacia: 7 Previsões Sobre IA Para os Próximos 5 Anos | Rafael Egg",
    description: "Descubra as 7 principais previsões sobre como a inteligência artificial vai transformar a advocacia até 2030. Tendências, oportunidades e o que todo advogado precisa saber.",
    canonical: `${BASE_URL}/blog/futuro-advocacia-ia-previsoes-2030`,
    ogTitle: "Futuro da Advocacia: 7 Previsões Sobre IA Para os Próximos 5 Anos",
    ogDescription: "As 7 previsões que todo advogado precisa conhecer sobre o futuro da IA na advocacia até 2030.",
    ogImage: OG_IMAGE,
    h1: "Futuro da Advocacia: 7 Previsões Sobre IA Para os Próximos 5 Anos",
    staticContent: `<article><h1>Futuro da Advocacia: 7 Previsões Sobre IA Para os Próximos 5 Anos</h1><p>A inteligência artificial está transformando profundamente a prática jurídica. Nos próximos cinco anos, veremos mudanças radicais na forma como advogados trabalham, atendem clientes e gerenciam escritórios. Desde a automação completa de tarefas repetitivas até a análise preditiva de decisões judiciais, a IA promete revolucionar cada aspecto da advocacia.</p><p>Neste artigo, Rafael Egg analisa as 7 tendências mais impactantes que moldarão o futuro da profissão jurídica, baseado em dados reais e na experiência prática de implementação de IA em dezenas de escritórios brasileiros. Descubra como se preparar para o futuro e garantir sua relevância no mercado jurídico.</p><p>Entre as previsões, destacam-se: a adoção massiva de assistentes jurídicos com IA, a transformação dos modelos de precificação, a personalização extrema do atendimento ao cliente e a emergência de novas especialidades jurídicas ligadas à tecnologia.</p><nav><a href="/blog">← Voltar ao Blog</a> | <a href="/">Início</a></nav></article>`,
    noscriptContent: `<h1>Futuro da Advocacia: 7 Previsões Sobre IA Para os Próximos 5 Anos</h1><p>Artigo por Rafael Egg sobre as tendências de IA na advocacia até 2030.</p><a href="/blog">Voltar ao Blog</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", "headline": "Futuro da Advocacia: 7 Previsões Sobre IA Para os Próximos 5 Anos", "author": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "datePublished": "2026-01-09", "dateModified": "2026-02-23", "publisher": { "@type": "Organization", "name": "Rafael Egg - IA para Advogados", "logo": { "@type": "ImageObject", "url": OG_IMAGE } }, "mainEntityOfPage": `${BASE_URL}/blog/futuro-advocacia-ia-previsoes-2030`, "image": OG_IMAGE, "description": "Descubra as 7 principais previsões sobre como a inteligência artificial vai transformar a advocacia até 2030." },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }, { name: "Futuro da Advocacia com IA", url: `${BASE_URL}/blog/futuro-advocacia-ia-previsoes-2030` })
    ],
    lastModified: TODAY, sitemapPriority: 0.6, changeFrequency: "monthly"
  },
  {
    path: "/blog/lgpd-inteligencia-artificial-advogados",
    title: "LGPD e Inteligência Artificial: O Que Todo Advogado Precisa Saber | Rafael Egg",
    description: "Guia completo sobre LGPD e IA na advocacia. Entenda como usar inteligência artificial em conformidade com a Lei Geral de Proteção de Dados na prática jurídica.",
    canonical: `${BASE_URL}/blog/lgpd-inteligencia-artificial-advogados`,
    ogTitle: "LGPD e Inteligência Artificial: O Que Todo Advogado Precisa Saber",
    ogDescription: "Como usar IA na advocacia respeitando a LGPD. Guia completo para advogados.",
    ogImage: OG_IMAGE, h1: "LGPD e Inteligência Artificial: O Que Todo Advogado Precisa Saber",
    staticContent: `<article><h1>LGPD e Inteligência Artificial: O Que Todo Advogado Precisa Saber</h1><p>A Lei Geral de Proteção de Dados trouxe novos desafios para advogados que utilizam ferramentas de inteligência artificial. Como garantir que o uso de ChatGPT, Claude e outras IAs esteja em conformidade com a LGPD? Quais cuidados tomar ao processar dados de clientes com IA?</p><p>Este guia completo aborda os principais aspectos da interseção entre LGPD e IA na advocacia, incluindo: bases legais para tratamento de dados com IA, anonimização de informações sensíveis, consentimento do titular e responsabilidade do advogado. Rafael Egg apresenta soluções práticas para usar IA de forma segura e legal.</p><p>Aprenda a implementar políticas de uso de IA no seu escritório que estejam em total conformidade com a legislação de proteção de dados, protegendo seus clientes e sua reputação profissional.</p><nav><a href="/blog">← Voltar ao Blog</a> | <a href="/">Início</a></nav></article>`,
    noscriptContent: `<h1>LGPD e Inteligência Artificial na Advocacia</h1><p>Guia por Rafael Egg sobre LGPD e IA para advogados.</p><a href="/blog">Voltar ao Blog</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", "headline": "LGPD e Inteligência Artificial: O Que Todo Advogado Precisa Saber", "author": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "datePublished": "2026-01-09", "dateModified": "2026-02-23", "publisher": { "@type": "Organization", "name": "Rafael Egg - IA para Advogados", "logo": { "@type": "ImageObject", "url": OG_IMAGE } }, "mainEntityOfPage": `${BASE_URL}/blog/lgpd-inteligencia-artificial-advogados`, "image": OG_IMAGE, "description": "Guia completo sobre LGPD e IA na advocacia." },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }, { name: "LGPD e IA", url: `${BASE_URL}/blog/lgpd-inteligencia-artificial-advogados` })
    ],
    lastModified: TODAY, sitemapPriority: 0.6, changeFrequency: "monthly"
  },
  {
    path: "/blog/ia-revolucionando-advocacia-2025",
    title: "Como a IA Está Revolucionando a Advocacia em 2025 | Rafael Egg",
    description: "Descubra como a inteligência artificial está transformando escritórios de advocacia em 2025. Cases reais, ferramentas e estratégias de implementação de IA jurídica.",
    canonical: `${BASE_URL}/blog/ia-revolucionando-advocacia-2025`,
    ogTitle: "Como a IA Está Revolucionando a Advocacia em 2025",
    ogDescription: "Cases reais e estratégias de como a IA está transformando a advocacia em 2025.",
    ogImage: OG_IMAGE, h1: "Como a Inteligência Artificial Está Revolucionando a Advocacia em 2025",
    staticContent: `<article><h1>Como a Inteligência Artificial Está Revolucionando a Advocacia em 2025</h1><p>O ano de 2025 marca um ponto de inflexão na adoção de inteligência artificial pelos escritórios de advocacia brasileiros. Ferramentas como ChatGPT, Claude e Gemini estão sendo integradas em processos jurídicos cotidianos, desde a elaboração de petições até a análise de contratos complexos.</p><p>Neste artigo, Rafael Egg compartilha cases reais de escritórios que já implementaram IA com sucesso, mostrando resultados concretos: redução de 60% no tempo de elaboração de documentos, aumento de 40% na captação de clientes e economia significativa em custos operacionais.</p><p>Explore as principais áreas onde a IA está gerando mais impacto na advocacia: pesquisa jurisprudencial automatizada, elaboração de peças processuais, gestão de prazos inteligente, atendimento ao cliente com chatbots jurídicos e análise preditiva de resultados judiciais.</p><nav><a href="/blog">← Voltar ao Blog</a> | <a href="/">Início</a></nav></article>`,
    noscriptContent: `<h1>IA Revolucionando a Advocacia em 2025</h1><p>Artigo por Rafael Egg sobre a revolução da IA na advocacia.</p><a href="/blog">Voltar ao Blog</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", "headline": "Como a Inteligência Artificial Está Revolucionando a Advocacia em 2025", "author": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "datePublished": "2026-01-08", "dateModified": "2026-02-23", "publisher": { "@type": "Organization", "name": "Rafael Egg - IA para Advogados", "logo": { "@type": "ImageObject", "url": OG_IMAGE } }, "mainEntityOfPage": `${BASE_URL}/blog/ia-revolucionando-advocacia-2025`, "image": OG_IMAGE, "description": "Como a IA está transformando escritórios de advocacia em 2025." },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }, { name: "IA Revolucionando a Advocacia", url: `${BASE_URL}/blog/ia-revolucionando-advocacia-2025` })
    ],
    lastModified: TODAY, sitemapPriority: 0.6, changeFrequency: "monthly"
  },
  {
    path: "/blog/chatgpt-advogados-10-prompts-essenciais",
    title: "ChatGPT Para Advogados: 10 Prompts Que Vão Transformar Sua Rotina | Rafael Egg",
    description: "10 prompts práticos de ChatGPT para advogados. Aprenda a usar IA para petições, contratos, pesquisa jurídica e mais. Guia com exemplos prontos para copiar e usar.",
    canonical: `${BASE_URL}/blog/chatgpt-advogados-10-prompts-essenciais`,
    ogTitle: "ChatGPT Para Advogados: 10 Prompts Essenciais",
    ogDescription: "10 prompts práticos de ChatGPT que todo advogado precisa conhecer.",
    ogImage: OG_IMAGE, h1: "ChatGPT Para Advogados: 10 Prompts Que Vão Transformar Sua Rotina",
    staticContent: `<article><h1>ChatGPT Para Advogados: 10 Prompts Que Vão Transformar Sua Rotina</h1><p>O ChatGPT se tornou uma ferramenta indispensável para advogados modernos. Mas a qualidade dos resultados depende diretamente da qualidade dos prompts utilizados. Neste guia prático, Rafael Egg compartilha os 10 prompts mais eficientes para a prática jurídica.</p><p>Cada prompt foi testado e refinado em situações reais da advocacia, cobrindo áreas como: elaboração de petições iniciais, análise de contratos, pesquisa de jurisprudência, redação de pareceres, preparação para audiências e gestão de prazos processuais.</p><p>Além dos prompts, você aprenderá técnicas avançadas de prompt engineering jurídico, como fornecer contexto adequado, definir o tom e estilo desejados, e estruturar instruções complexas para obter respostas precisas e utilizáveis na sua prática diária.</p><nav><a href="/blog">← Voltar ao Blog</a> | <a href="/">Início</a></nav></article>`,
    noscriptContent: `<h1>ChatGPT Para Advogados: 10 Prompts Essenciais</h1><p>Guia prático por Rafael Egg com prompts de ChatGPT para advogados.</p><a href="/blog">Voltar ao Blog</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", "headline": "ChatGPT Para Advogados: 10 Prompts Que Vão Transformar Sua Rotina", "author": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "datePublished": "2026-01-08", "dateModified": "2026-02-23", "publisher": { "@type": "Organization", "name": "Rafael Egg - IA para Advogados", "logo": { "@type": "ImageObject", "url": OG_IMAGE } }, "mainEntityOfPage": `${BASE_URL}/blog/chatgpt-advogados-10-prompts-essenciais`, "image": OG_IMAGE, "description": "10 prompts práticos de ChatGPT para advogados." },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }, { name: "ChatGPT: 10 Prompts", url: `${BASE_URL}/blog/chatgpt-advogados-10-prompts-essenciais` })
    ],
    lastModified: TODAY, sitemapPriority: 0.6, changeFrequency: "monthly"
  },
  {
    path: "/blog/etica-ia-advocacia-guia-definitivo",
    title: "Ética e IA na Advocacia: O Guia Definitivo | Rafael Egg",
    description: "Guia definitivo sobre ética no uso de inteligência artificial na advocacia. OAB, responsabilidade profissional, sigilo e boas práticas para advogados que usam IA.",
    canonical: `${BASE_URL}/blog/etica-ia-advocacia-guia-definitivo`,
    ogTitle: "Ética e IA na Advocacia: O Guia Definitivo",
    ogDescription: "Tudo sobre ética no uso de IA na advocacia: OAB, sigilo e responsabilidade.",
    ogImage: OG_IMAGE, h1: "Ética e Inteligência Artificial na Advocacia: O Guia Definitivo",
    staticContent: `<article><h1>Ética e Inteligência Artificial na Advocacia: O Guia Definitivo</h1><p>O uso de inteligência artificial na advocacia levanta questões éticas fundamentais. Como garantir o sigilo profissional ao usar ChatGPT? Qual a responsabilidade do advogado por conteúdo gerado por IA? O que a OAB diz sobre o uso dessas ferramentas?</p><p>Este guia definitivo aborda todas as dimensões éticas do uso de IA na prática jurídica, desde os princípios fundamentais do Código de Ética da OAB até situações práticas do dia a dia. Rafael Egg analisa casos concretos e apresenta diretrizes claras para uso responsável.</p><p>Temas abordados: dever de sigilo com ferramentas de IA, transparência com clientes sobre uso de tecnologia, responsabilidade por erros de IA, limites éticos na automação jurídica e o papel do advogado na era da inteligência artificial.</p><nav><a href="/blog">← Voltar ao Blog</a> | <a href="/">Início</a></nav></article>`,
    noscriptContent: `<h1>Ética e IA na Advocacia</h1><p>Guia definitivo por Rafael Egg sobre ética e IA na prática jurídica.</p><a href="/blog">Voltar ao Blog</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", "headline": "Ética e Inteligência Artificial na Advocacia: O Guia Definitivo", "author": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "datePublished": "2026-01-08", "dateModified": "2026-02-23", "publisher": { "@type": "Organization", "name": "Rafael Egg - IA para Advogados", "logo": { "@type": "ImageObject", "url": OG_IMAGE } }, "mainEntityOfPage": `${BASE_URL}/blog/etica-ia-advocacia-guia-definitivo`, "image": OG_IMAGE, "description": "Guia definitivo sobre ética no uso de IA na advocacia." },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }, { name: "Ética e IA", url: `${BASE_URL}/blog/etica-ia-advocacia-guia-definitivo` })
    ],
    lastModified: TODAY, sitemapPriority: 0.6, changeFrequency: "monthly"
  },
  {
    path: "/blog/ferramentas-ia-gratuitas-advogados",
    title: "5 Ferramentas de IA Gratuitas Que Todo Advogado Precisa Conhecer | Rafael Egg",
    description: "Conheça 5 ferramentas gratuitas de inteligência artificial para advogados. ChatGPT, Gemini, Claude e mais. Comece a usar IA na advocacia sem investimento inicial.",
    canonical: `${BASE_URL}/blog/ferramentas-ia-gratuitas-advogados`,
    ogTitle: "5 Ferramentas de IA Gratuitas Para Advogados",
    ogDescription: "5 ferramentas de IA gratuitas que todo advogado precisa conhecer hoje.",
    ogImage: OG_IMAGE, h1: "5 Ferramentas de IA Gratuitas Que Todo Advogado Precisa Conhecer",
    staticContent: `<article><h1>5 Ferramentas de IA Gratuitas Que Todo Advogado Precisa Conhecer</h1><p>Você não precisa investir dinheiro para começar a usar inteligência artificial na sua prática jurídica. Existem diversas ferramentas gratuitas de IA que podem transformar a produtividade do seu escritório de advocacia imediatamente.</p><p>Neste artigo, Rafael Egg apresenta as 5 melhores ferramentas gratuitas de IA para advogados, com análise detalhada de cada uma: pontos fortes, limitações, casos de uso ideais na advocacia e dicas práticas de como extrair o máximo de cada ferramenta.</p><p>Das ferramentas apresentadas, você aprenderá a usar ChatGPT para rascunhos de petições, Gemini para pesquisa jurisprudencial, Claude para análise de contratos longos, além de ferramentas especializadas para transcrição de audiências e organização de documentos jurídicos.</p><nav><a href="/blog">← Voltar ao Blog</a> | <a href="/">Início</a></nav></article>`,
    noscriptContent: `<h1>Ferramentas de IA Gratuitas Para Advogados</h1><p>5 ferramentas gratuitas de IA para advogados por Rafael Egg.</p><a href="/blog">Voltar ao Blog</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", "headline": "5 Ferramentas de IA Gratuitas Que Todo Advogado Precisa Conhecer", "author": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "datePublished": "2026-01-08", "dateModified": "2026-02-23", "publisher": { "@type": "Organization", "name": "Rafael Egg - IA para Advogados", "logo": { "@type": "ImageObject", "url": OG_IMAGE } }, "mainEntityOfPage": `${BASE_URL}/blog/ferramentas-ia-gratuitas-advogados`, "image": OG_IMAGE, "description": "5 ferramentas gratuitas de IA para advogados." },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }, { name: "Ferramentas Gratuitas", url: `${BASE_URL}/blog/ferramentas-ia-gratuitas-advogados` })
    ],
    lastModified: TODAY, sitemapPriority: 0.6, changeFrequency: "monthly"
  },
  {
    path: "/blog/automatizar-contratos-inteligencia-artificial",
    title: "Como Automatizar Contratos Com Inteligência Artificial | Rafael Egg",
    description: "Aprenda a automatizar a elaboração, revisão e gestão de contratos com IA. Guia prático com ferramentas, prompts e fluxos de trabalho para escritórios de advocacia.",
    canonical: `${BASE_URL}/blog/automatizar-contratos-inteligencia-artificial`,
    ogTitle: "Como Automatizar Contratos Com IA",
    ogDescription: "Guia prático para automatizar contratos com inteligência artificial na advocacia.",
    ogImage: OG_IMAGE, h1: "Como Automatizar Contratos Com Inteligência Artificial",
    staticContent: `<article><h1>Como Automatizar Contratos Com Inteligência Artificial</h1><p>A elaboração e revisão de contratos é uma das atividades mais frequentes em escritórios de advocacia — e também uma das mais passíveis de automação com inteligência artificial. Com as ferramentas e técnicas certas, é possível reduzir drasticamente o tempo gasto nessas tarefas.</p><p>Neste guia prático, Rafael Egg mostra como implementar automação de contratos usando IA, desde templates inteligentes até revisão automatizada de cláusulas. Você aprenderá a criar fluxos de trabalho que combinam modelos de linguagem com seus processos existentes.</p><p>O artigo cobre: criação de templates de contratos com IA, revisão automatizada de cláusulas de risco, extração de informações-chave de contratos existentes, comparação de versões com destaque de alterações e integração de IA com sistemas de gestão contratual.</p><nav><a href="/blog">← Voltar ao Blog</a> | <a href="/">Início</a></nav></article>`,
    noscriptContent: `<h1>Automatizar Contratos Com IA</h1><p>Guia prático por Rafael Egg sobre automação de contratos com IA.</p><a href="/blog">Voltar ao Blog</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", "headline": "Como Automatizar Contratos Com Inteligência Artificial", "author": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "datePublished": "2026-01-08", "dateModified": "2026-02-23", "publisher": { "@type": "Organization", "name": "Rafael Egg - IA para Advogados", "logo": { "@type": "ImageObject", "url": OG_IMAGE } }, "mainEntityOfPage": `${BASE_URL}/blog/automatizar-contratos-inteligencia-artificial`, "image": OG_IMAGE, "description": "Guia prático para automatizar contratos com IA." },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }, { name: "Automatizar Contratos", url: `${BASE_URL}/blog/automatizar-contratos-inteligencia-artificial` })
    ],
    lastModified: TODAY, sitemapPriority: 0.6, changeFrequency: "monthly"
  },
  {
    path: "/blog/pesquisa-juridica-ia-jurisprudencia-minutos",
    title: "Pesquisa Jurídica Com IA: Encontre Jurisprudência em Minutos | Rafael Egg",
    description: "Aprenda a usar inteligência artificial para pesquisa jurídica e encontrar jurisprudência relevante em minutos. Técnicas avançadas com ChatGPT, Claude e ferramentas especializadas.",
    canonical: `${BASE_URL}/blog/pesquisa-juridica-ia-jurisprudencia-minutos`,
    ogTitle: "Pesquisa Jurídica Com IA: Jurisprudência em Minutos",
    ogDescription: "Encontre jurisprudência relevante em minutos usando IA. Técnicas práticas.",
    ogImage: OG_IMAGE, h1: "Pesquisa Jurídica Com IA: Encontre Jurisprudência em Minutos",
    staticContent: `<article><h1>Pesquisa Jurídica Com IA: Encontre Jurisprudência em Minutos</h1><p>A pesquisa jurisprudencial é uma das tarefas mais demoradas na advocacia. O que antes levava horas de busca em portais dos tribunais agora pode ser feito em minutos com o auxílio da inteligência artificial. Mas é preciso saber como usar as ferramentas corretamente.</p><p>Rafael Egg ensina técnicas avançadas de pesquisa jurídica com IA, incluindo: como formular buscas eficientes, validar resultados gerados por IA, cruzar informações entre diferentes bases de dados e organizar a jurisprudência encontrada de forma estratégica para cada caso.</p><p>O artigo apresenta um método passo a passo para pesquisa jurídica com IA, combinando ferramentas como ChatGPT e Claude com portais oficiais dos tribunais, garantindo precisão e confiabilidade nos resultados encontrados.</p><nav><a href="/blog">← Voltar ao Blog</a> | <a href="/">Início</a></nav></article>`,
    noscriptContent: `<h1>Pesquisa Jurídica Com IA</h1><p>Técnicas de pesquisa jurisprudencial com IA por Rafael Egg.</p><a href="/blog">Voltar ao Blog</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", "headline": "Pesquisa Jurídica Com IA: Encontre Jurisprudência em Minutos", "author": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "datePublished": "2026-01-08", "dateModified": "2026-02-23", "publisher": { "@type": "Organization", "name": "Rafael Egg - IA para Advogados", "logo": { "@type": "ImageObject", "url": OG_IMAGE } }, "mainEntityOfPage": `${BASE_URL}/blog/pesquisa-juridica-ia-jurisprudencia-minutos`, "image": OG_IMAGE, "description": "Pesquisa jurídica com IA para encontrar jurisprudência em minutos." },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }, { name: "Pesquisa Jurídica com IA", url: `${BASE_URL}/blog/pesquisa-juridica-ia-jurisprudencia-minutos` })
    ],
    lastModified: TODAY, sitemapPriority: 0.6, changeFrequency: "monthly"
  },
  {
    path: "/blog/ia-advocacia-como-comecar-guia-iniciantes",
    title: "IA na Advocacia: Como Começar do Zero - Guia Para Iniciantes | Rafael Egg",
    description: "Guia completo para advogados iniciantes em inteligência artificial. Passo a passo para começar a usar IA na advocacia, mesmo sem conhecimento técnico prévio.",
    canonical: `${BASE_URL}/blog/ia-advocacia-como-comecar-guia-iniciantes`,
    ogTitle: "IA na Advocacia: Como Começar do Zero",
    ogDescription: "Guia para iniciantes: como começar a usar IA na advocacia passo a passo.",
    ogImage: OG_IMAGE, h1: "IA na Advocacia: Como Começar do Zero (Guia Para Iniciantes)",
    staticContent: `<article><h1>IA na Advocacia: Como Começar do Zero (Guia Para Iniciantes)</h1><p>Se você é advogado e ainda não começou a usar inteligência artificial na sua prática, este guia foi feito para você. Não importa seu nível de conhecimento técnico — Rafael Egg criou um roteiro passo a passo para qualquer advogado iniciar sua jornada com IA.</p><p>O guia cobre desde os conceitos básicos de inteligência artificial até aplicações práticas imediatas na advocacia. Você aprenderá a criar sua primeira conta em ferramentas de IA, escrever seus primeiros prompts jurídicos e integrar a tecnologia na sua rotina sem complicação.</p><p>Tópicos incluem: o que é IA generativa e como funciona, criando sua conta no ChatGPT e Claude, seus primeiros 5 prompts jurídicos, como organizar uma rotina com IA, erros comuns de iniciantes e como evitá-los, e próximos passos para aprofundamento.</p><nav><a href="/blog">← Voltar ao Blog</a> | <a href="/">Início</a></nav></article>`,
    noscriptContent: `<h1>IA na Advocacia: Como Começar</h1><p>Guia para iniciantes em IA na advocacia por Rafael Egg.</p><a href="/blog">Voltar ao Blog</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", "headline": "IA na Advocacia: Como Começar do Zero (Guia Para Iniciantes)", "author": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "datePublished": "2026-01-08", "dateModified": "2026-02-23", "publisher": { "@type": "Organization", "name": "Rafael Egg - IA para Advogados", "logo": { "@type": "ImageObject", "url": OG_IMAGE } }, "mainEntityOfPage": `${BASE_URL}/blog/ia-advocacia-como-comecar-guia-iniciantes`, "image": OG_IMAGE, "description": "Guia completo para advogados iniciantes em IA." },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }, { name: "Como Começar com IA", url: `${BASE_URL}/blog/ia-advocacia-como-comecar-guia-iniciantes` })
    ],
    lastModified: TODAY, sitemapPriority: 0.6, changeFrequency: "monthly"
  },
  {
    path: "/blog/aumentar-produtividade-escritorio-advocacia-ia",
    title: "Como Aumentar a Produtividade do Escritório de Advocacia Com IA | Rafael Egg",
    description: "Estratégias práticas para aumentar a produtividade do escritório de advocacia com inteligência artificial. Automação, gestão de tempo e otimização de processos jurídicos.",
    canonical: `${BASE_URL}/blog/aumentar-produtividade-escritorio-advocacia-ia`,
    ogTitle: "Produtividade na Advocacia Com IA",
    ogDescription: "Aumente a produtividade do seu escritório em até 60% com IA. Estratégias práticas.",
    ogImage: OG_IMAGE, h1: "Como Aumentar a Produtividade do Escritório de Advocacia Com IA",
    staticContent: `<article><h1>Como Aumentar a Produtividade do Escritório de Advocacia Com IA</h1><p>Escritórios de advocacia que implementam inteligência artificial de forma estratégica conseguem aumentar sua produtividade em até 60%. Mas como alcançar esses resultados na prática? Quais processos devem ser automatizados primeiro? Como medir o retorno do investimento em IA?</p><p>Rafael Egg compartilha estratégias testadas e comprovadas em dezenas de escritórios brasileiros, mostrando exatamente quais processos priorizar na automação, como treinar a equipe para usar IA e como criar métricas de produtividade que demonstrem resultados concretos.</p><p>O artigo aborda: mapeamento de processos para automação, priorização por impacto vs. esforço, implementação gradual de IA, treinamento de equipe, métricas de produtividade, cases reais com resultados mensuráveis e um plano de ação de 90 dias para transformar a produtividade do seu escritório.</p><nav><a href="/blog">← Voltar ao Blog</a> | <a href="/">Início</a></nav></article>`,
    noscriptContent: `<h1>Produtividade na Advocacia Com IA</h1><p>Estratégias por Rafael Egg para aumentar produtividade com IA.</p><a href="/blog">Voltar ao Blog</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", "headline": "Como Aumentar a Produtividade do Escritório de Advocacia Com IA", "author": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "datePublished": "2026-01-08", "dateModified": "2026-02-23", "publisher": { "@type": "Organization", "name": "Rafael Egg - IA para Advogados", "logo": { "@type": "ImageObject", "url": OG_IMAGE } }, "mainEntityOfPage": `${BASE_URL}/blog/aumentar-produtividade-escritorio-advocacia-ia`, "image": OG_IMAGE, "description": "Estratégias para aumentar produtividade na advocacia com IA." },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }, { name: "Produtividade com IA", url: `${BASE_URL}/blog/aumentar-produtividade-escritorio-advocacia-ia` })
    ],
    lastModified: TODAY, sitemapPriority: 0.6, changeFrequency: "monthly"
  }
];

// ─── Main routes ───
export const seoRoutes: SEORouteData[] = [
  {
    path: "/",
    title: "Rafael Egg - IA para Advogados | Consultoria, Mentoria e Cursos",
    description: "Rafael Egg é advogado desde 2008, mentor em IA para advogados e criador do Método IDEA. Consultoria, mentoria, cursos e e-books para transformar seu escritório com inteligência artificial. Melhor Escritório em IA do Brasil 2025.",
    canonical: `${BASE_URL}/`,
    ogTitle: "Rafael Egg - IA para Advogados | Consultoria, Mentoria e Cursos",
    ogDescription: "Especialista em Inteligência Artificial para Advogados. Consultoria IDEA, Mentoria, Cursos e E-books. Melhor Escritório em IA do Brasil 2025.",
    ogImage: OG_IMAGE,
    h1: "Rafael Egg - Inteligência Artificial para Advogados",
    staticContent: `<header style="border-bottom:3px solid #F5A524;padding-bottom:15px;margin-bottom:25px;">
<h1 style="font-size:2em;color:#1a1a2e;margin:0 0 10px 0;">Rafael Egg - Inteligência Artificial para Advogados</h1>
<p style="margin:5px 0;"><strong>Advogado desde 2008 | Mentor em IA para Advogados | Criador do Método IDEA</strong></p>
<p style="margin:5px 0;color:#F5A524;font-weight:bold;">🏆 Melhor Escritório em Inteligência Artificial do Brasil 2025 - Law Summit</p>
<nav style="margin-top:15px;display:flex;gap:15px;flex-wrap:wrap;">
<a href="/" style="color:#F5A524;text-decoration:none;font-weight:500;">Início</a>
<a href="/consultoria" style="color:#F5A524;text-decoration:none;font-weight:500;">Consultoria IDEA</a>
<a href="/blog" style="color:#F5A524;text-decoration:none;font-weight:500;">Blog</a>
<a href="/bio" style="color:#F5A524;text-decoration:none;font-weight:500;">Sobre Rafael</a>
<a href="/ebook" style="color:#F5A524;text-decoration:none;font-weight:500;">E-books</a>
</nav>
</header>
<main>
<section style="margin-bottom:40px;">
<h2>Transformando a Advocacia com Inteligência Artificial</h2>
<p>Rafael Egg Nunes é advogado desde 2008, mentor especializado em inteligência artificial para advogados e sócio do Egg Nunes Advogados Associados. Com mais de 15 anos de experiência jurídica combinada com expertise em tecnologia, Rafael ajuda escritórios de advocacia a aumentarem sua produtividade em até 60% através da implementação estratégica de IA.</p>
<p>Em 2025, seu escritório foi premiado como <strong>Melhor Escritório em Inteligência Artificial do Brasil</strong> pela Law Summit.</p>
</section>
<section style="margin-bottom:40px;">
<h2>O Método IDEA - Inteligência de Dados e Artificial</h2>
<p>Metodologia exclusiva para transformar escritórios de advocacia com IA: automatizar rotinas, captar clientes, escalar faturamento e usar ChatGPT, Claude, Gemini de forma ética.</p>
<ul><li>Economia de 270-415 horas/mês</li><li>ROI de 1.820-3.500% em 12 meses</li><li>Payback em 10-19 dias</li></ul>
</section>
<section style="margin-bottom:40px;">
<h2>Serviços e Produtos</h2>
<h3><a href="/consultoria">Consultoria IDEA</a></h3><p>Implementação personalizada de IA em escritórios de advocacia, 3 a 6 meses.</p>
<h3>Mentoria para Advogados</h3><p>Acompanhamento individual para dominar IA na prática jurídica.</p>
<h3>Curso IDEA</h3><p>Formação completa em IA para advogados.</p>
<h3><a href="/ebook">E-books</a></h3><p>Guia Prático de IA, Código dos Prompts e Combo de E-books.</p>
</section>
<section style="margin-bottom:40px;">
<h2>Artigos do Blog</h2>
<ul>
<li><a href="/blog/futuro-advocacia-ia-previsoes-2030">Futuro da Advocacia: 7 Previsões Sobre IA</a></li>
<li><a href="/blog/lgpd-inteligencia-artificial-advogados">LGPD e Inteligência Artificial</a></li>
<li><a href="/blog/ia-revolucionando-advocacia-2025">IA Revolucionando a Advocacia em 2025</a></li>
<li><a href="/blog/chatgpt-advogados-10-prompts-essenciais">ChatGPT: 10 Prompts Essenciais</a></li>
<li><a href="/blog/etica-ia-advocacia-guia-definitivo">Ética e IA na Advocacia</a></li>
<li><a href="/blog/ferramentas-ia-gratuitas-advogados">Ferramentas de IA Gratuitas</a></li>
<li><a href="/blog/automatizar-contratos-inteligencia-artificial">Automatizar Contratos com IA</a></li>
<li><a href="/blog/pesquisa-juridica-ia-jurisprudencia-minutos">Pesquisa Jurídica com IA</a></li>
<li><a href="/blog/ia-advocacia-como-comecar-guia-iniciantes">IA na Advocacia: Como Começar</a></li>
<li><a href="/blog/aumentar-produtividade-escritorio-advocacia-ia">Produtividade com IA</a></li>
</ul>
<p><a href="/blog">Ver todos os artigos →</a></p>
</section>
<section style="margin-bottom:40px;">
<h2>Perguntas Frequentes</h2>
<h3>Preciso saber programar para usar IA na advocacia?</h3><p>Não. Todos os produtos são projetados para advogados de qualquer nível técnico.</p>
<h3>O uso de IA na advocacia é ético?</h3><p>Sim, quando usado corretamente. A OAB permite o uso de IA como apoio ao trabalho advocatício.</p>
<h3>O que é o Método IDEA?</h3><p>Metodologia exclusiva de Rafael Egg para automatizar rotinas, captar clientes e escalar faturamento com IA.</p>
</section>
</main>
<footer style="border-top:1px solid #ccc;padding-top:20px;color:#666;font-size:0.9em;">
<p>© 2026 Rafael Egg. Todos os direitos reservados. | <a href="/privacidade">Política de Privacidade</a></p>
</footer>`,
    noscriptContent: `<h1>Rafael Egg - Inteligência Artificial para Advogados</h1>
<p>Advogado desde 2008, mentor em IA e criador do Método IDEA. Melhor Escritório em IA do Brasil 2025.</p>
<nav><a href="/consultoria">Consultoria IDEA</a> | <a href="/blog">Blog</a> | <a href="/bio">Sobre</a> | <a href="/ebook">E-books</a></nav>`,
    jsonLd: [personSchema, organizationSchema, websiteSchema, faqSchema, breadcrumb()],
    lastModified: TODAY, sitemapPriority: 1.0, changeFrequency: "weekly"
  },
  {
    path: "/consultoria",
    title: "Consultoria IDEA - Implementação de IA para Escritórios de Advocacia | Rafael Egg",
    description: "Consultoria personalizada para implementação de inteligência artificial em escritórios de advocacia. Método IDEA com ROI de 1.820-3.500% em 12 meses. Diagnóstico, plano de implementação, treinamento e suporte por 3 a 6 meses.",
    canonical: `${BASE_URL}/consultoria`,
    ogTitle: "Consultoria IDEA - IA para Escritórios de Advocacia",
    ogDescription: "Implemente IA no seu escritório com a Consultoria IDEA de Rafael Egg. Economize 270-415 horas/mês. ROI de 1.820-3.500% em 12 meses.",
    ogImage: OG_IMAGE,
    h1: "Consultoria IDEA - Implementação de IA para Escritórios de Advocacia",
    staticContent: `<header style="border-bottom:3px solid #F5A524;padding-bottom:15px;margin-bottom:25px;">
<nav style="display:flex;gap:15px;flex-wrap:wrap;margin-bottom:10px;">
<a href="/" style="color:#F5A524;">Início</a> &gt; <a href="/consultoria" style="color:#F5A524;font-weight:bold;">Consultoria IDEA</a>
</nav>
<h1 style="font-size:2em;color:#1a1a2e;">Consultoria IDEA - Implementação de IA para Escritórios de Advocacia</h1>
</header>
<main>
<section style="margin-bottom:30px;">
<h2>O Que É a Consultoria IDEA?</h2>
<p>A Consultoria IDEA (Inteligência de Dados e Artificial) é um programa personalizado de implementação de inteligência artificial em escritórios de advocacia, criado por Rafael Egg. Com duração de 3 a 6 meses, o programa transforma a operação do seu escritório através da aplicação estratégica de IA em processos jurídicos, administrativos e comerciais.</p>
<p>Diferente de cursos genéricos, a Consultoria IDEA é uma implementação prática e personalizada. Rafael Egg trabalha lado a lado com o advogado e sua equipe para mapear processos, identificar oportunidades de automação e implementar soluções de IA que geram resultados mensuráveis desde as primeiras semanas.</p>
</section>
<section style="margin-bottom:30px;">
<h2>Resultados Comprovados</h2>
<ul>
<li><strong>Economia de 270-415 horas por mês</strong> em tarefas repetitivas</li>
<li><strong>Aumento de produtividade de até 10x</strong> em determinados processos</li>
<li><strong>ROI de 1.820-3.500%</strong> em 12 meses</li>
<li><strong>Payback em 10-19 dias</strong> — retorno rápido do investimento</li>
<li><strong>Redução de 60%</strong> no tempo de elaboração de documentos jurídicos</li>
<li><strong>Aumento de 40%</strong> na captação de novos clientes</li>
</ul>
</section>
<section style="margin-bottom:30px;">
<h2>Etapas da Consultoria</h2>
<ol>
<li><strong>Diagnóstico Personalizado:</strong> Análise completa do escritório, processos, equipe e oportunidades</li>
<li><strong>Plano de Implementação:</strong> Estratégia customizada com priorização por impacto e viabilidade</li>
<li><strong>Implementação a Quatro Mãos:</strong> Sessões práticas de trabalho conjunto para aplicar IA</li>
<li><strong>Treinamento da Equipe:</strong> Capacitação prática de todos os membros do escritório</li>
<li><strong>Suporte Contínuo:</strong> Acompanhamento pós-implementação para garantir resultados</li>
</ol>
</section>
<section style="margin-bottom:30px;">
<h2>Para Quem É a Consultoria?</h2>
<p>A Consultoria IDEA é ideal para escritórios de advocacia de todos os portes que desejam: aumentar produtividade com IA, reduzir custos operacionais, captar mais clientes, escalar o faturamento sem aumentar a equipe proporcionalmente e se posicionar como escritório inovador.</p>
<p><a href="/consultoria/economia" style="color:#F5A524;font-weight:bold;">Calcule quanto seu escritório pode economizar com IA →</a></p>
</section>
</main>
<footer style="border-top:1px solid #ccc;padding-top:15px;color:#666;">
<p><a href="/">← Voltar ao Início</a> | <a href="/blog">Blog</a> | <a href="/bio">Sobre Rafael Egg</a></p>
<p>© 2026 Rafael Egg. Todos os direitos reservados.</p>
</footer>`,
    noscriptContent: `<h1>Consultoria IDEA - Implementação de IA para Escritórios de Advocacia</h1>
<p>Consultoria personalizada por Rafael Egg. ROI de 1.820-3.500% em 12 meses. Economia de 270-415 horas/mês.</p>
<nav><a href="/">Início</a> | <a href="/consultoria/economia">Economia com IA</a> | <a href="/blog">Blog</a></nav>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Service", "name": "Consultoria IDEA - Inteligência de Dados e Artificial", "description": "Implementação personalizada de IA em escritórios de advocacia. Metodologia exclusiva para automatizar rotinas, captar clientes e escalar faturamento com inteligência artificial.", "provider": { "@type": "Person", "name": "Rafael Egg", "url": BASE_URL }, "url": `${BASE_URL}/consultoria`, "areaServed": "BR", "serviceType": "Consultoria em Inteligência Artificial para Advocacia" },
      breadcrumb({ name: "Consultoria IDEA", url: `${BASE_URL}/consultoria` }),
      personSchema
    ],
    lastModified: TODAY, sitemapPriority: 0.9, changeFrequency: "monthly"
  },
  {
    path: "/consultoria/economia",
    title: "Economia com IA na Advocacia - Calculadora de ROI | Rafael Egg",
    description: "Descubra quanto seu escritório pode economizar com inteligência artificial. Calculadora de ROI e dados reais sobre economia de tempo e aumento de produtividade na advocacia com IA.",
    canonical: `${BASE_URL}/consultoria/economia`,
    ogTitle: "Economia com IA na Advocacia - Calculadora de ROI",
    ogDescription: "Calcule quanto seu escritório pode economizar com IA. Dados reais de produtividade.",
    ogImage: OG_IMAGE,
    h1: "Economia com IA na Advocacia",
    staticContent: `<header style="border-bottom:3px solid #F5A524;padding-bottom:15px;margin-bottom:25px;">
<nav><a href="/" style="color:#F5A524;">Início</a> &gt; <a href="/consultoria" style="color:#F5A524;">Consultoria IDEA</a> &gt; <strong>Economia com IA</strong></nav>
<h1 style="font-size:2em;color:#1a1a2e;">Economia com IA na Advocacia</h1>
</header>
<main>
<section style="margin-bottom:30px;">
<h2>Quanto Seu Escritório Pode Economizar?</h2>
<p>A implementação estratégica de inteligência artificial em escritórios de advocacia gera economias significativas e mensuráveis. Escritórios que participaram da Consultoria IDEA reportam economia média de 270 a 415 horas por mês em tarefas repetitivas, representando um ROI de 1.820% a 3.500% em 12 meses.</p>
<p>Esses números são baseados em dados reais de escritórios brasileiros que implementaram IA com a metodologia do Rafael Egg. A economia vem da automação de tarefas como: elaboração de petições, revisão de contratos, pesquisa jurisprudencial, gestão de prazos e atendimento inicial de clientes.</p>
</section>
<section style="margin-bottom:30px;">
<h2>Dados Reais de Economia</h2>
<ul>
<li><strong>Elaboração de petições:</strong> redução de 70% no tempo</li>
<li><strong>Pesquisa jurisprudencial:</strong> de horas para minutos</li>
<li><strong>Revisão de contratos:</strong> 60% mais rápida com IA</li>
<li><strong>Atendimento inicial:</strong> automatização de 80% das consultas repetitivas</li>
<li><strong>Gestão de prazos:</strong> eliminação de 95% dos erros manuais</li>
</ul>
<p><a href="/consultoria" style="color:#F5A524;font-weight:bold;">← Conheça a Consultoria IDEA</a></p>
</section>
</main>`,
    noscriptContent: `<h1>Economia com IA na Advocacia</h1><p>Calculadora de ROI e dados reais de economia com IA em escritórios.</p><a href="/consultoria">Consultoria IDEA</a> | <a href="/">Início</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "WebPage", "name": "Economia com IA na Advocacia", "description": "Calculadora de ROI para escritórios de advocacia que implementam IA.", "url": `${BASE_URL}/consultoria/economia` },
      breadcrumb({ name: "Consultoria IDEA", url: `${BASE_URL}/consultoria` }, { name: "Economia com IA", url: `${BASE_URL}/consultoria/economia` })
    ],
    lastModified: TODAY, sitemapPriority: 0.8, changeFrequency: "monthly"
  },
  {
    path: "/blog",
    title: "Blog sobre IA na Advocacia - Artigos, Dicas e Guias | Rafael Egg",
    description: "Artigos sobre inteligência artificial para advogados. Aprenda a usar ChatGPT, Claude e Gemini na advocacia. Dicas de prompts jurídicos, automação e produtividade para escritórios.",
    canonical: `${BASE_URL}/blog`,
    ogTitle: "Blog sobre IA na Advocacia",
    ogDescription: "Artigos sobre IA para advogados: ChatGPT, prompts jurídicos, automação e produtividade.",
    ogImage: OG_IMAGE,
    h1: "Blog sobre Inteligência Artificial na Advocacia",
    staticContent: `<header style="border-bottom:3px solid #F5A524;padding-bottom:15px;margin-bottom:25px;">
<nav><a href="/" style="color:#F5A524;">Início</a> &gt; <strong>Blog</strong></nav>
<h1 style="font-size:2em;color:#1a1a2e;">Blog sobre Inteligência Artificial na Advocacia</h1>
<p>Artigos práticos sobre como usar inteligência artificial na prática jurídica. Escrito por Rafael Egg, advogado e mentor em IA para advocacia.</p>
</header>
<main>
<section>
<h2>Artigos Publicados</h2>
<ul style="list-style:none;padding:0;">
<li style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #eee;">
<h3><a href="/blog/futuro-advocacia-ia-previsoes-2030" style="color:#1a1a2e;">Futuro da Advocacia: 7 Previsões Sobre IA Para os Próximos 5 Anos</a></h3>
<p>Descubra as 7 principais previsões sobre como a IA vai transformar a advocacia até 2030.</p>
</li>
<li style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #eee;">
<h3><a href="/blog/lgpd-inteligencia-artificial-advogados" style="color:#1a1a2e;">LGPD e Inteligência Artificial: O Que Todo Advogado Precisa Saber</a></h3>
<p>Guia completo sobre LGPD e IA na advocacia.</p>
</li>
<li style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #eee;">
<h3><a href="/blog/ia-revolucionando-advocacia-2025" style="color:#1a1a2e;">Como a IA Está Revolucionando a Advocacia em 2025</a></h3>
<p>Cases reais e estratégias de implementação de IA em escritórios.</p>
</li>
<li style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #eee;">
<h3><a href="/blog/chatgpt-advogados-10-prompts-essenciais" style="color:#1a1a2e;">ChatGPT Para Advogados: 10 Prompts Essenciais</a></h3>
<p>10 prompts práticos de ChatGPT que todo advogado precisa conhecer.</p>
</li>
<li style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #eee;">
<h3><a href="/blog/etica-ia-advocacia-guia-definitivo" style="color:#1a1a2e;">Ética e IA na Advocacia: O Guia Definitivo</a></h3>
<p>Guia definitivo sobre ética no uso de IA na prática jurídica.</p>
</li>
<li style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #eee;">
<h3><a href="/blog/ferramentas-ia-gratuitas-advogados" style="color:#1a1a2e;">5 Ferramentas de IA Gratuitas Para Advogados</a></h3>
<p>Ferramentas gratuitas de IA para começar a usar hoje na advocacia.</p>
</li>
<li style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #eee;">
<h3><a href="/blog/automatizar-contratos-inteligencia-artificial" style="color:#1a1a2e;">Como Automatizar Contratos Com IA</a></h3>
<p>Guia prático para automação de contratos com inteligência artificial.</p>
</li>
<li style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #eee;">
<h3><a href="/blog/pesquisa-juridica-ia-jurisprudencia-minutos" style="color:#1a1a2e;">Pesquisa Jurídica Com IA: Jurisprudência em Minutos</a></h3>
<p>Encontre jurisprudência relevante em minutos usando IA.</p>
</li>
<li style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #eee;">
<h3><a href="/blog/ia-advocacia-como-comecar-guia-iniciantes" style="color:#1a1a2e;">IA na Advocacia: Como Começar do Zero</a></h3>
<p>Guia para iniciantes: passo a passo para usar IA na advocacia.</p>
</li>
<li style="margin-bottom:20px;">
<h3><a href="/blog/aumentar-produtividade-escritorio-advocacia-ia" style="color:#1a1a2e;">Produtividade na Advocacia Com IA</a></h3>
<p>Estratégias para aumentar a produtividade do escritório com IA.</p>
</li>
</ul>
</section>
</main>
<footer style="border-top:1px solid #ccc;padding-top:15px;color:#666;">
<p><a href="/">← Início</a> | <a href="/consultoria">Consultoria IDEA</a> | <a href="/bio">Sobre Rafael</a></p>
</footer>`,
    noscriptContent: `<h1>Blog sobre IA na Advocacia</h1><p>Artigos por Rafael Egg sobre inteligência artificial para advogados.</p>
<ul><li><a href="/blog/chatgpt-advogados-10-prompts-essenciais">ChatGPT: 10 Prompts</a></li><li><a href="/blog/ferramentas-ia-gratuitas-advogados">Ferramentas Gratuitas</a></li><li><a href="/blog/etica-ia-advocacia-guia-definitivo">Ética e IA</a></li></ul>
<a href="/">Início</a>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Blog", "name": "Blog sobre IA na Advocacia", "description": "Artigos sobre inteligência artificial para advogados.", "url": `${BASE_URL}/blog`, "author": { "@type": "Person", "name": "Rafael Egg" }, "inLanguage": "pt-BR" },
      breadcrumb({ name: "Blog", url: `${BASE_URL}/blog` }),
      { "@context": "https://schema.org", "@type": "ItemList", "name": "Artigos sobre IA na Advocacia", "itemListElement": blogPostsSEO.map((post, i) => ({ "@type": "ListItem", "position": i + 1, "url": post.canonical, "name": post.h1 })) }
    ],
    lastModified: TODAY, sitemapPriority: 0.8, changeFrequency: "weekly"
  },
  {
    path: "/bio",
    title: "Sobre Rafael Egg - Advogado e Mentor em IA para Advocacia",
    description: "Conheça Rafael Egg Nunes: advogado desde 2008, mentor em inteligência artificial para advogados, criador do Método IDEA e sócio do Egg Nunes Advogados Associados. Premiado como Melhor Escritório em IA do Brasil 2025.",
    canonical: `${BASE_URL}/bio`,
    ogTitle: "Sobre Rafael Egg - Mentor em IA para Advogados",
    ogDescription: "Advogado desde 2008, mentor em IA, criador do Método IDEA. Premiado como Melhor Escritório em IA do Brasil 2025.",
    ogImage: OG_IMAGE,
    h1: "Sobre Rafael Egg - Advogado e Mentor em IA",
    staticContent: `<header style="border-bottom:3px solid #F5A524;padding-bottom:15px;margin-bottom:25px;">
<nav><a href="/" style="color:#F5A524;">Início</a> &gt; <strong>Sobre Rafael Egg</strong></nav>
<h1 style="font-size:2em;color:#1a1a2e;">Sobre Rafael Egg - Advogado e Mentor em IA</h1>
</header>
<main>
<section style="margin-bottom:30px;">
<h2>Quem É Rafael Egg?</h2>
<p>Rafael Egg Nunes é advogado desde 2008, formado pela Universidade Federal do Paraná (UFPR), e sócio do Egg Nunes Advogados Associados. Com mais de 15 anos de experiência na prática jurídica, Rafael se especializou na interseção entre direito e tecnologia, tornando-se referência nacional em inteligência artificial aplicada à advocacia.</p>
<p>Em 2025, seu escritório recebeu o prêmio de <strong>Melhor Escritório em Inteligência Artificial do Brasil</strong> pela Law Summit, consolidando seu reconhecimento como pioneiro na aplicação de IA no universo jurídico brasileiro.</p>
</section>
<section style="margin-bottom:30px;">
<h2>Trajetória e Conquistas</h2>
<ul>
<li><strong>2008:</strong> Formatura em Direito pela UFPR e início da carreira advocatícia</li>
<li><strong>2020:</strong> Início da pesquisa em IA aplicada ao Direito</li>
<li><strong>2023:</strong> Criação do Método IDEA</li>
<li><strong>2024:</strong> Lançamento da Consultoria IDEA e dos E-books</li>
<li><strong>2025:</strong> Prêmio Melhor Escritório em IA do Brasil - Law Summit</li>
</ul>
</section>
<section style="margin-bottom:30px;">
<h2>Projetos</h2>
<ul>
<li><strong>Egg Nunes Advogados Associados</strong> - Escritório de advocacia</li>
<li><strong>Robô de Toga</strong> - Plataforma de automação jurídica</li>
<li><strong>Vagas Jurídicas</strong> - Portal de oportunidades jurídicas</li>
<li><strong>AI Teleprompter</strong> - Aplicativo de criação de conteúdo com IA</li>
</ul>
</section>
</main>
<footer style="border-top:1px solid #ccc;padding-top:15px;color:#666;">
<p><a href="/">← Início</a> | <a href="/consultoria">Consultoria IDEA</a> | <a href="/blog">Blog</a></p>
</footer>`,
    noscriptContent: `<h1>Sobre Rafael Egg</h1><p>Advogado desde 2008, mentor em IA, criador do Método IDEA. Melhor Escritório em IA do Brasil 2025.</p><a href="/">Início</a> | <a href="/consultoria">Consultoria</a>`,
    jsonLd: [
      { ...personSchema, "alumniOf": { "@type": "CollegeOrUniversity", "name": "Universidade Federal do Paraná (UFPR)" } },
      breadcrumb({ name: "Sobre Rafael Egg", url: `${BASE_URL}/bio` })
    ],
    lastModified: TODAY, sitemapPriority: 0.7, changeFrequency: "monthly"
  },
  {
    path: "/ebook",
    title: "E-books sobre IA na Advocacia - Guia Prático e Código dos Prompts | Rafael Egg",
    description: "E-books e guias práticos sobre inteligência artificial para advogados. Guia Prático de IA, Código dos Prompts para petições e contratos, e Combo completo de e-books.",
    canonical: `${BASE_URL}/ebook`,
    ogTitle: "E-books sobre IA na Advocacia",
    ogDescription: "E-books práticos sobre IA para advogados: Guia de IA, Código dos Prompts e Combo.",
    ogImage: OG_IMAGE,
    h1: "E-books sobre Inteligência Artificial na Advocacia",
    staticContent: `<header style="border-bottom:3px solid #F5A524;padding-bottom:15px;margin-bottom:25px;">
<nav><a href="/" style="color:#F5A524;">Início</a> &gt; <strong>E-books</strong></nav>
<h1 style="font-size:2em;color:#1a1a2e;">E-books sobre Inteligência Artificial na Advocacia</h1>
<p>Guias práticos escritos por Rafael Egg para advogados que querem dominar a inteligência artificial na prática jurídica.</p>
</header>
<main>
<section style="margin-bottom:30px;">
<h2>Guia Prático de IA para Advogados</h2>
<p>O guia completo para advogados que querem começar a usar inteligência artificial na sua prática. Cobre desde os fundamentos de IA até aplicações avançadas na advocacia, com exemplos práticos e passo a passo detalhado. Ideal para quem quer uma visão completa e estruturada do tema.</p>
</section>
<section style="margin-bottom:30px;">
<h2>Código dos Prompts</h2>
<p>Coletânea dos melhores prompts jurídicos para ChatGPT, Claude e Gemini. Prompts testados e otimizados para: elaboração de petições, análise de contratos, pesquisa jurisprudencial, redação de pareceres, preparação de audiências e muito mais. Copie, cole e adapte para o seu caso.</p>
</section>
<section style="margin-bottom:30px;">
<h2>Combo de E-books</h2>
<p>Pacote completo com todos os e-books sobre IA na advocacia. Inclui o Guia Prático de IA, o Código dos Prompts e materiais bônus exclusivos. A forma mais completa e econômica de dominar a inteligência artificial na prática jurídica.</p>
</section>
</main>
<footer style="border-top:1px solid #ccc;padding-top:15px;color:#666;">
<p><a href="/">← Início</a> | <a href="/consultoria">Consultoria IDEA</a> | <a href="/blog">Blog</a></p>
</footer>`,
    noscriptContent: `<h1>E-books sobre IA na Advocacia</h1><p>Guia Prático de IA, Código dos Prompts e Combo de E-books por Rafael Egg.</p><a href="/">Início</a> | <a href="/blog">Blog</a>`,
    jsonLd: [
      breadcrumb({ name: "E-books", url: `${BASE_URL}/ebook` }),
      { "@context": "https://schema.org", "@type": "ItemList", "name": "E-books sobre IA na Advocacia", "itemListElement": [
        { "@type": "ListItem", "position": 1, "item": { "@type": "Book", "name": "Guia Prático de IA para Advogados", "author": { "@type": "Person", "name": "Rafael Egg" }, "description": "Guia completo para advogados usarem IA na prática jurídica." } },
        { "@type": "ListItem", "position": 2, "item": { "@type": "Book", "name": "Código dos Prompts", "author": { "@type": "Person", "name": "Rafael Egg" }, "description": "Coletânea dos melhores prompts jurídicos para ChatGPT, Claude e Gemini." } },
        { "@type": "ListItem", "position": 3, "item": { "@type": "Book", "name": "Combo de E-books", "author": { "@type": "Person", "name": "Rafael Egg" }, "description": "Pacote completo com todos os e-books sobre IA na advocacia." } }
      ] }
    ],
    lastModified: TODAY, sitemapPriority: 0.7, changeFrequency: "monthly"
  },
  {
    path: "/privacidade",
    title: "Política de Privacidade | Rafael Egg - IA para Advogados",
    description: "Política de privacidade do site Rafael Egg. Saiba como coletamos, usamos e protegemos seus dados pessoais.",
    canonical: `${BASE_URL}/privacidade`,
    ogTitle: "Política de Privacidade - Rafael Egg",
    ogDescription: "Política de privacidade do site Rafael Egg.",
    ogImage: OG_IMAGE,
    h1: "Política de Privacidade",
    staticContent: `<h1>Política de Privacidade</h1><p>Política de privacidade do site rafaelegg.com.</p><a href="/">← Início</a>`,
    noscriptContent: `<h1>Política de Privacidade</h1><p>Política de privacidade de rafaelegg.com.</p><a href="/">Início</a>`,
    jsonLd: [breadcrumb({ name: "Privacidade", url: `${BASE_URL}/privacidade` })],
    lastModified: TODAY, sitemapPriority: 0.3, changeFrequency: "yearly"
  },
  // Include all blog posts
  ...blogPostsSEO
];

// Helper to find route data by path
export function getSEORouteData(path: string): SEORouteData | undefined {
  return seoRoutes.find(r => r.path === path);
}

// Generate sitemap XML from registry
export function generateSitemapXml(): string {
  const entries = seoRoutes.map(route => `  <url>
    <loc>${route.canonical}</loc>
    <lastmod>${route.lastModified}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.sitemapPriority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}
