import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  Instagram,
  Youtube,
  BookOpen,
  Loader2
} from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import logoRE from "@/assets/logo-re.png";
import { SEOHead } from "@/components/seo/SEOHead";
import { useBlogPost, useBlogPosts } from "@/hooks/useBlogPosts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import DOMPurify from "dompurify";


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
  // Artigos sem imagem específica - retornarão null
  // "lgpd-inteligencia-artificial-advogados": null,
  // "futuro-advocacia-ia-previsoes-2030": null,
};

function getArticleImage(slug?: string): string | null {
  if (!slug) return null;
  return articleImagesBySlug[slug] || null;
}

export function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useBlogPost(slug || "");
  const { data: allPosts } = useBlogPosts(true);

  // Get related articles (other articles from the same category or just other articles)
  const relatedArticles = allPosts
    ?.filter(post => post.slug !== slug)
    ?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#0f1419] to-[#1a1f2e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !article) {
    return <Navigate to="/blog" replace />;
  }

  const formattedDate = article.published_at 
    ? format(new Date(article.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Em breve";

  // Convert markdown-like content to HTML
  const formatContent = (content: string) => {
    return content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-white mt-8 mb-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-white mt-10 mb-6">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-white mt-10 mb-6">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-amber-400 hover:text-amber-300 underline">$1</a>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-800 rounded-lg p-4 overflow-x-auto my-4 text-sm"><code class="text-green-400">$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-slate-800 px-2 py-1 rounded text-amber-400">$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-amber-500 pl-4 py-2 my-4 italic text-slate-300 bg-slate-800/50 rounded-r-lg">$1</blockquote>')
      // Unordered lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4 text-slate-300 mb-2">$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-slate-300 mb-2">$1</li>')
      // Tables (basic support)
      .replace(/\|(.*)\|/g, (match) => {
        const cells = match.split('|').filter(cell => cell.trim());
        if (cells.every(cell => cell.trim().match(/^-+$/))) {
          return ''; // Skip separator rows
        }
        return `<tr class="border-b border-slate-700">${cells.map(cell => `<td class="px-4 py-2 text-slate-300">${cell.trim()}</td>`).join('')}</tr>`;
      })
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="text-slate-300 leading-relaxed mb-4">')
      // Line breaks
      .replace(/\n/g, '<br/>');
  };


  const articleUrl = `https://rafaelegg.com/blog/${article.slug}`;
  const articleImage = article.cover_image_url || getArticleImage(article.slug) || "https://rafaelegg.com/og-image.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#0f1419] to-[#1a1f2e]">
      <SEOHead
        title={`${article.title} | Rafael Egg - IA para Advogados`}
        description={article.excerpt || `Leia sobre ${article.title} no blog de Rafael Egg.`}
        canonical={articleUrl}
        ogImage={articleImage}
        ogType="article"
      />

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
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Blog
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Article */}
      <article className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Cover Image - só exibe se existir imagem para o artigo */}
        {getArticleImage(article.slug) && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10">
            <img 
              src={getArticleImage(article.slug)!} 
              alt={article.title}
              className="w-full h-64 md:h-80 lg:h-96 object-cover"
            />
          </div>
        )}

        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {article.category && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                <BookOpen className="w-3 h-3 mr-1" />
                {article.category}
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Rafael Egg
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.read_time_minutes} min de leitura
            </span>
          </div>

          {article.excerpt && (
            <p className="text-xl text-slate-300 leading-relaxed border-l-4 border-amber-500 pl-4">
              {article.excerpt}
            </p>
          )}
        </div>

        {/* Article Content */}
        <div 
          className="prose prose-invert prose-amber max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(
              `<p class="text-slate-300 leading-relaxed mb-4">${formatContent(article.content)}</p>`,
              { ADD_ATTR: ['target'] }
            )
          }}
        />

        {/* Share */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Share2 className="w-5 h-5" />
              <span>Compartilhe este artigo</span>
            </div>
            <div className="flex gap-2">
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(article.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-blue-400 hover:bg-slate-700 transition-all duration-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-green-400 hover:bg-slate-700 transition-all duration-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 p-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl">
          <h3 className="text-2xl font-bold text-white mb-4">
            Quer Dominar a IA na Advocacia?
          </h3>
          <p className="text-slate-300 mb-6">
            Conheça a Consultoria em IA para Advogados e transforme sua prática jurídica com metodologia comprovada.
          </p>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" asChild>
            <Link to="/consultoria">
              Conhecer a Consultoria
            </Link>
          </Button>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="container mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Artigos Relacionados
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {relatedArticles.map(post => (
              <Link 
                key={post.id}
                to={`/blog/${post.slug}`}
                className="block"
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all duration-300 group hover:scale-[1.02] h-full">
                  <CardContent className="p-6">
                    {post.category && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400 mb-3">
                        {post.category}
                      </Badge>
                    )}
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors duration-300 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{post.excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

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
  );
}
