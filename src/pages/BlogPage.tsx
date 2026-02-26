import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  BookOpen,
  Sparkles,
  Instagram,
  Youtube,
  ExternalLink,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd } from "@/components/seo/JsonLd";
import logoRE from "@/assets/logo-re.png";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


// Blog images - mapeamento exato por slug (sem repetição)
import blogIaRevolucionando from "@/assets/blog-ia-revolucionando.png";
import blogChatgptPrompts from "@/assets/blog-chatgpt-prompts.png";
import blogEticaIa from "@/assets/blog-etica-ia.png";
import blogFerramentasIa from "@/assets/blog-ferramentas-ia.png";
import blogContratosIa from "@/assets/blog-contratos-ia.png";
import blogPesquisaJuridica from "@/assets/blog-pesquisa-juridica.png";
import blogIaIniciantes from "@/assets/blog-ia-iniciantes.png";
import blogProdutividade from "@/assets/blog-produtividade.png";

// Mapeamento EXATO por slug - cada imagem pertence a apenas um artigo
const articleImagesBySlug: Record<string, string> = {
  "ia-revolucionando-advocacia-2025": blogIaRevolucionando,
  "chatgpt-advogados-10-prompts-essenciais": blogChatgptPrompts,
  "etica-ia-advocacia-guia-definitivo": blogEticaIa,
  "ferramentas-ia-gratuitas-advogados": blogFerramentasIa,
  "automatizar-contratos-inteligencia-artificial": blogContratosIa,
  "pesquisa-juridica-ia-jurisprudencia-minutos": blogPesquisaJuridica,
  "ia-advocacia-como-comecar-guia-iniciantes": blogIaIniciantes,
  "aumentar-produtividade-escritorio-advocacia-ia": blogProdutividade,
  "futuro-advocacia-ia-previsoes-2030": "/blog-futuro-advocacia.png",
  "lgpd-inteligencia-artificial-advogados": "/blog-lgpd-ia.png",
};

function getArticleImage(slug?: string): string | null {
  if (!slug) return null;
  return articleImagesBySlug[slug] || null;
}

// Default articles if no dynamic content exists
const defaultArticles = [
  {
    id: "1",
    title: "Como a Inteligência Artificial Está Revolucionando a Advocacia em 2025",
    excerpt: "Descubra as principais tendências de inteligência artificial que estão revolucionando a prática jurídica no Brasil e no mundo.",
    category: "Tendências",
    read_time_minutes: 8,
    published_at: new Date().toISOString(),
    is_published: true,
    slug: "ia-revolucionando-advocacia-2025"
  },
  {
    id: "2",
    title: "ChatGPT Para Advogados: 10 Prompts Que Vão Transformar Sua Rotina",
    excerpt: "Aprenda a usar prompts eficientes para ChatGPT e outras IAs, otimizando a elaboração de peças processuais.",
    category: "Tutorial",
    read_time_minutes: 10,
    published_at: new Date().toISOString(),
    is_published: true,
    slug: "chatgpt-prompts-advogados"
  },
  {
    id: "3",
    title: "Ética e Inteligência Artificial na Advocacia: O Guia Definitivo",
    excerpt: "Uma análise das questões éticas envolvendo o uso de inteligência artificial na prática jurídica.",
    category: "Ética",
    read_time_minutes: 7,
    published_at: new Date().toISOString(),
    is_published: true,
    slug: "etica-ia-advocacia"
  },
  {
    id: "4",
    title: "5 Ferramentas de IA Gratuitas Que Todo Advogado Precisa Conhecer",
    excerpt: "Conheça as ferramentas que todo advogado moderno precisa dominar para aumentar sua produtividade e competitividade.",
    category: "Ferramentas",
    read_time_minutes: 6,
    published_at: new Date().toISOString(),
    is_published: true,
    slug: "ferramentas-ia-gratuitas-advogados"
  },
  {
    id: "5",
    title: "Como Automatizar Contratos Com Inteligência Artificial",
    excerpt: "Veja como a IA pode acelerar a análise e elaboração de contratos, reduzindo erros e aumentando a eficiência.",
    category: "Prática",
    read_time_minutes: 9,
    published_at: new Date().toISOString(),
    is_published: true,
    slug: "automatizar-contratos-ia"
  },
  {
    id: "6",
    title: "Pesquisa Jurídica Com IA: Encontre Jurisprudência em Minutos",
    excerpt: "Aprenda técnicas avançadas de pesquisa jurídica usando inteligência artificial para encontrar jurisprudência relevante rapidamente.",
    category: "Tutorial",
    read_time_minutes: 8,
    published_at: new Date().toISOString(),
    is_published: true,
    slug: "pesquisa-juridica-ia"
  },
  {
    id: "7",
    title: "IA na Advocacia: Como Começar do Zero (Guia Para Iniciantes)",
    excerpt: "Um guia completo para advogados que querem dar os primeiros passos no mundo da inteligência artificial.",
    category: "Iniciantes",
    read_time_minutes: 12,
    published_at: new Date().toISOString(),
    is_published: true,
    slug: "ia-advocacia-iniciantes"
  },
  {
    id: "8",
    title: "Como Aumentar a Produtividade do Escritório de Advocacia Com IA",
    excerpt: "Estratégias práticas para implementar IA no seu escritório e aumentar a produtividade da equipe.",
    category: "Produtividade",
    read_time_minutes: 10,
    published_at: new Date().toISOString(),
    is_published: true,
    slug: "produtividade-escritorio-ia"
  }
];

export function BlogPage() {
  const { data: dynamicPosts, isLoading } = useBlogPosts(true);
  
  // Use dynamic posts if available, otherwise use defaults
  const articles = dynamicPosts && dynamicPosts.length > 0 
    ? dynamicPosts 
    : defaultArticles;

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);




  return (
    <>
      <SEOHead
        title="Blog sobre IA na Advocacia | Dicas e Tendências | Rafael Egg"
        description="Artigos sobre inteligência artificial para advogados: ferramentas, prompts, automação de contratos, pesquisa jurídica e tendências do setor jurídico."
        canonical="https://rafaelegg.com/blog"
      />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Blog sobre IA na Advocacia",
        "description": "Artigos sobre inteligência artificial para advogados.",
        "url": "https://rafaelegg.com/blog",
        "author": { "@type": "Person", "name": "Rafael Egg" },
        "inLanguage": "pt-BR"
      }} />
      
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#0f1419] to-[#1a1f2e]">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent" />
        
        <nav className="relative z-10 container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <img src={logoRE} alt="Rafael Egg" className="h-20 w-20 object-contain transition-transform duration-300 group-hover:scale-110" />
              <span className="text-2xl font-bold text-white tracking-tight">Rafael Egg</span>
            </Link>
            <Button variant="ghost" className="text-slate-300 hover:text-amber-400" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-6 py-16 text-center">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">
            <BookOpen className="w-3 h-3 mr-1" />
            Blog
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            IA na <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Advocacia</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Artigos, tutoriais e insights sobre como a inteligência artificial está transformando o mundo jurídico
          </p>
        </div>
      </header>

      {/* Removed category filter cards as per user request */}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          {/* Featured Article */}
          {featuredArticle && (
            <section className="container mx-auto px-6 py-8">
              <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50 transition-all duration-300 group overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-amber-500 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                        {featuredArticle.category && (
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {featuredArticle.category}
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300">
                        {featuredArticle.title}
                      </h2>
                      <p className="text-slate-300 text-lg">{featuredArticle.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Rafael Egg
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {featuredArticle.published_at 
                            ? format(new Date(featuredArticle.published_at), "dd MMM yyyy", { locale: ptBR })
                            : "Em breve"
                          }
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {featuredArticle.read_time_minutes} min
                        </span>
                      </div>
                      <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white mt-4" asChild>
                        <Link to={`/blog/${featuredArticle.slug}`}>
                          Ler Artigo
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    {getArticleImage(featuredArticle.slug) && (
                      <div className="w-full md:w-80 h-48 rounded-xl overflow-hidden">
                        <img 
                          src={getArticleImage(featuredArticle.slug)!} 
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Articles Grid */}
          <section className="container mx-auto px-6 py-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherArticles.map(article => (
                <Link 
                  key={article.id}
                  to={`/blog/${article.slug}`}
                  className="block"
                >
                  <Card 
                    className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10 h-full"
                  >
                    <CardContent className="p-6">
                      {getArticleImage(article.slug) && (
                        <div className="h-40 rounded-lg mb-4 overflow-hidden">
                          <img 
                            src={getArticleImage(article.slug)!} 
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      {article.category && (
                        <Badge variant="outline" className="border-amber-500/30 text-amber-400 mb-3">
                          {article.category}
                        </Badge>
                      )}
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors duration-300 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{article.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {article.published_at 
                            ? format(new Date(article.published_at), "dd MMM yyyy", { locale: ptBR })
                            : "Em breve"
                          }
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.read_time_minutes} min
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Newsletter CTA */}
      <section className="py-16 bg-gradient-to-r from-amber-600/20 to-orange-600/20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Receba novos artigos por email
          </h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Inscreva-se para receber atualizações sobre IA na advocacia diretamente na sua caixa de entrada
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Seu melhor email"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
              Inscrever
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoRE} alt="Rafael Egg" className="h-12 w-12 object-contain" />
              <span className="text-xl font-bold text-white">Rafael Egg</span>
            </Link>
            <div className="flex gap-3">
              <a 
                href="https://www.instagram.com/rafaeleggnunes/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-pink-400 hover:bg-slate-700 transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://www.tiktok.com/@rafaeleggnunes" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300"
                aria-label="TikTok"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://youtube.com/@rafaeleggnunes" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-700 transition-all duration-300"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Rafael Egg. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
