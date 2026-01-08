import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Lightbulb,
  ExternalLink,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Scale,
  Brain,
  Award,
  Target,
  Sparkles
} from "lucide-react";
import logoMetodoIdeia from "@/assets/logo-metodo-ideia.png";
import logoConsultoria from "@/assets/logo-consultoria.png";
import fotoRafael from "@/assets/foto-rafael.jpg";

export function HomePage() {
  const products = [
    {
      title: "Mentoria Individual",
      description: "Acompanhamento personalizado para advogados que querem dominar a IA",
      icon: Users,
      link: "https://mentoriarafaelegg.com.br/inscricoes-abertas/",
      highlight: true,
      external: true
    },
    {
      title: "Curso IDEIA",
      description: "Formação completa em Inteligência de Dados e Artificial para advogados",
      icon: GraduationCap,
      link: "https://mentoriarafaelegg.com.br/curso-idea/",
      logo: logoMetodoIdeia,
      highlight: true,
      external: true
    },
    {
      title: "Consultoria IDEIA",
      description: "Consultoria personalizada em IA para escritórios de advocacia",
      icon: Target,
      link: "https://mentoriarafaelegg.com.br/consultoria-idea/",
      logo: logoConsultoria,
      highlight: true,
      external: true
    },
    {
      title: "Guia de IA",
      description: "Guia prático para começar a usar IA na advocacia",
      icon: BookOpen,
      link: "https://mentoriarafaelegg.com.br/guia-de-ia/",
      highlight: false,
      external: true
    },
    {
      title: "Código dos Prompts",
      description: "E-book com os melhores prompts para advogados",
      icon: Lightbulb,
      link: "https://mentoriarafaelegg.com.br/codigo-dos-prompts/",
      highlight: false,
      external: true
    },
    {
      title: "Combo de E-books",
      description: "Pacote completo com todos os e-books sobre IA na advocacia",
      icon: BookOpen,
      link: "https://mentoriarafaelegg.com.br/combo-de-ebooks/",
      highlight: false,
      external: true
    }
  ];

  const achievements = [
    { number: "3", label: "E-books Publicados" },
    { number: "500+", label: "Advogados Capacitados" },
    { number: "10+", label: "Anos de Advocacia" },
    { number: "50+", label: "Escritórios Atendidos" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#0f1419] to-[#1a1f2e]">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <nav className="relative z-10 container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-amber-500" />
              <span className="text-2xl font-bold text-white tracking-tight">Rafael Egg</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#sobre" className="text-slate-300 hover:text-white transition-colors font-medium">Sobre</a>
              <a href="#produtos" className="text-slate-300 hover:text-white transition-colors font-medium">Produtos</a>
              <a href="#contato" className="text-slate-300 hover:text-white transition-colors font-medium">Contato</a>
              <Button asChild variant="outline" className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white">
                <a href="/consultoria">Área do Cliente</a>
              </Button>
            </div>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30 font-semibold">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Mentor em IA para Advocacia
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                  Transformando a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Advocacia</span> com Inteligência Artificial
                </h1>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Advogado, mentor e especialista em aplicação de IA no universo jurídico. 
                  Ajudo escritórios a aumentarem sua produtividade e resultados através da tecnologia.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 font-semibold" asChild>
                  <a href="/consultoria">
                    Iniciar Consultoria
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" asChild>
                  <a href="#produtos">Conhecer Produtos</a>
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <a href="https://www.instagram.com/rafaelegg/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-pink-400 hover:bg-slate-700 transition-all">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.linkedin.com/in/rafaelegg/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-blue-400 hover:bg-slate-700 transition-all">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="https://www.youtube.com/@rafaelegg" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-700 transition-all">
                  <Youtube className="h-5 w-5" />
                </a>
                <a href="mailto:contato@rafaelegg.com" className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-all">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="relative flex flex-col items-center gap-8">
              {/* Foto profissional */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur-2xl opacity-30 scale-110" />
                <img 
                  src={fotoRafael} 
                  alt="Rafael Egg - Mentor em IA para Advocacia"
                  className="relative w-64 h-80 md:w-72 md:h-96 object-cover object-top rounded-2xl shadow-2xl border-2 border-amber-500/30"
                />
              </div>

              {/* Achievements grid - only on desktop */}
              <div className="hidden md:grid grid-cols-2 gap-4 w-full max-w-sm">
                {achievements.map((item, index) => (
                  <div key={index} className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                      {item.number}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sobre Section */}
      <section id="sobre" className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">Sobre</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Quem é Rafael Egg</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all">
                <CardContent className="p-6 text-center">
                  <Scale className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Advogado</h3>
                  <p className="text-slate-400">Mais de 10 anos de experiência no mercado jurídico brasileiro</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all">
                <CardContent className="p-6 text-center">
                  <Brain className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Especialista em IA</h3>
                  <p className="text-slate-400">Pioneiro na aplicação de inteligência artificial na advocacia</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all">
                <CardContent className="p-6 text-center">
                  <Award className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Mentor & Autor</h3>
                  <p className="text-slate-400">3 e-books publicados e centenas de advogados capacitados</p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-8 border border-amber-500/20">
              <p className="text-lg text-slate-300 leading-relaxed">
                Sou advogado e mentor especializado em ajudar escritórios de advocacia a implementarem 
                soluções de Inteligência Artificial em suas rotinas. Através do <strong className="text-amber-400">Método IDEIA</strong> 
                (Inteligência de Dados e Artificial), desenvolvo metodologias práticas que permitem 
                advogados aumentarem sua produtividade, reduzirem custos operacionais e entregarem 
                mais valor aos seus clientes.
              </p>
              <p className="text-lg text-slate-300 leading-relaxed mt-4">
                Minha missão é democratizar o acesso à tecnologia de ponta no mundo jurídico, 
                tornando a IA acessível e aplicável para advogados de todas as áreas de atuação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Produtos Section */}
      <section id="produtos" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">Produtos & Serviços</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Soluções para sua Advocacia</h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
              Conheça as ferramentas e serviços que vão transformar a forma como você pratica advocacia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <Card 
                key={index} 
                className={`bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all duration-300 group ${
                  product.highlight ? 'ring-2 ring-amber-500/30' : ''
                }`}
              >
                <CardContent className="p-6">
                  {product.logo ? (
                    <div className="h-16 mb-4 flex items-center">
                      <img 
                        src={product.logo} 
                        alt={product.title} 
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <product.icon className="h-12 w-12 text-amber-500 mb-4 group-hover:text-orange-500 transition-colors" />
                  )}
                  <h3 className="text-xl font-semibold text-white mb-2">{product.title}</h3>
                  <p className="text-slate-400 mb-4">{product.description}</p>
                  <Button 
                    variant="ghost" 
                    className="text-amber-500 hover:text-orange-500 hover:bg-amber-500/10 p-0"
                    asChild
                  >
                    <a href={product.link} target={product.external ? "_blank" : undefined} rel={product.external ? "noopener noreferrer" : undefined}>
                      Saiba mais
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-600/20 to-orange-600/20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
            Pronto para transformar seu escritório?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Comece agora sua jornada de transformação digital com a Consultoria IDEIA
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold" asChild>
              <a href="/consultoria">
                Agendar Consultoria
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <a href="mailto:contato@rafaelegg.com">
                <Mail className="mr-2 h-4 w-4" />
                Entrar em Contato
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="py-12 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-amber-500" />
                <span className="text-xl font-bold text-white">Rafael Egg</span>
              </div>
              <p className="text-slate-400">
                Mentor em Inteligência Artificial para Advocacia
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Links Rápidos</h4>
              <ul className="space-y-2">
                <li><a href="/consultoria" className="text-slate-400 hover:text-amber-500 transition-colors">Consultoria</a></li>
                <li><a href="/metodo-ideia" className="text-slate-400 hover:text-amber-500 transition-colors">Método IDEIA</a></li>
                <li><a href="https://mentoriarafaelegg.com.br/combo-de-ebooks/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-amber-500 transition-colors">E-books</a></li>
                <li><a href="/privacidade" className="text-slate-400 hover:text-amber-500 transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Redes Sociais</h4>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/rafaelegg/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-pink-400 hover:bg-slate-700 transition-all">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.linkedin.com/in/rafaelegg/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-blue-400 hover:bg-slate-700 transition-all">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="https://www.youtube.com/@rafaelegg" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-700 transition-all">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} Rafael Egg. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
