import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Brain,
  BookOpen,
  Sparkles,
  Scale,
  Instagram,
  Linkedin,
  Youtube,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";

export function BlogPage() {
  const articles = [
    {
      id: 1,
      title: "Como a IA está Transformando o Direito em 2024",
      excerpt: "Descubra as principais tendências de inteligência artificial que estão revolucionando a prática jurídica no Brasil e no mundo.",
      author: "Rafael Egg",
      date: "08 Jan 2025",
      readTime: "8 min",
      category: "Tendências",
      featured: true
    },
    {
      id: 2,
      title: "5 Ferramentas de IA Essenciais para Advogados",
      excerpt: "Conheça as ferramentas que todo advogado moderno precisa dominar para aumentar sua produtividade e competitividade.",
      author: "Rafael Egg",
      date: "05 Jan 2025",
      readTime: "6 min",
      category: "Ferramentas"
    },
    {
      id: 3,
      title: "Prompts Jurídicos: O Guia Completo",
      excerpt: "Aprenda a criar prompts eficientes para ChatGPT e outras IAs, otimizando a elaboração de peças processuais.",
      author: "Rafael Egg",
      date: "02 Jan 2025",
      readTime: "10 min",
      category: "Tutorial"
    },
    {
      id: 4,
      title: "Ética e IA na Advocacia: O que você precisa saber",
      excerpt: "Uma análise das questões éticas envolvendo o uso de inteligência artificial na prática jurídica.",
      author: "Rafael Egg",
      date: "28 Dez 2024",
      readTime: "7 min",
      category: "Ética"
    },
    {
      id: 5,
      title: "Automatizando Contratos com Inteligência Artificial",
      excerpt: "Veja como a IA pode acelerar a análise e elaboração de contratos, reduzindo erros e aumentando a eficiência.",
      author: "Rafael Egg",
      date: "25 Dez 2024",
      readTime: "9 min",
      category: "Prática"
    },
    {
      id: 6,
      title: "O Futuro da Pesquisa Jurídica com IA",
      excerpt: "Como as ferramentas de IA estão transformando a forma como advogados pesquisam jurisprudência e doutrina.",
      author: "Rafael Egg",
      date: "22 Dez 2024",
      readTime: "5 min",
      category: "Tendências"
    }
  ];

  const categories = ["Todos", "Tendências", "Ferramentas", "Tutorial", "Ética", "Prática"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#0f1419] to-[#1a1f2e]">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent" />
        
        <nav className="relative z-10 container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <Scale className="h-8 w-8 text-amber-500 transition-transform duration-300 group-hover:scale-110" />
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

      {/* Categories */}
      <section className="container mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category, index) => (
            <Button
              key={index}
              variant={index === 0 ? "default" : "outline"}
              size="sm"
              className={index === 0 
                ? "bg-amber-500 hover:bg-amber-600 text-white" 
                : "border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-amber-500/50"
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      {/* Featured Article */}
      {articles.filter(a => a.featured).map(article => (
        <section key={article.id} className="container mx-auto px-6 py-8">
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50 transition-all duration-300 group overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-500 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Destaque
                    </Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {article.category}
                    </Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300">
                    {article.title}
                  </h2>
                  <p className="text-slate-300 text-lg">{article.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {article.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {article.readTime}
                    </span>
                  </div>
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white mt-4">
                    Ler Artigo
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full md:w-64 h-48 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-24 h-24 text-amber-500/50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ))}

      {/* Articles Grid */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.filter(a => !a.featured).map(article => (
            <Card 
              key={article.id}
              className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10"
            >
              <CardContent className="p-6">
                <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg mb-4 flex items-center justify-center">
                  <Brain className="w-12 h-12 text-amber-500/30 group-hover:text-amber-500/50 transition-colors duration-300" />
                </div>
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 mb-3">
                  {article.category}
                </Badge>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors duration-300 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{article.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {article.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

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
              <Scale className="h-6 w-6 text-amber-500" />
              <span className="text-xl font-bold text-white">Rafael Egg</span>
            </Link>
            <div className="flex gap-3">
              <a 
                href="https://www.instagram.com/rafaelegg/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-pink-400 hover:bg-slate-700 transition-all duration-300"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://www.linkedin.com/in/rafaelegg/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-blue-400 hover:bg-slate-700 transition-all duration-300"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://www.youtube.com/@rafaelegg" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-700 transition-all duration-300"
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
