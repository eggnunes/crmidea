import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Lightbulb,
  ExternalLink,
  Instagram,
  Youtube,
  Mail,
  Brain,
  Award,
  Target,
  Sparkles,
  HelpCircle,
  Send,
  Loader2,
  Phone,
  Shield,
  Menu,
  X
} from "lucide-react";
import logoRE from "@/assets/logo-re.png";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { personSchema, organizationSchema, generateFAQSchema, generateBreadcrumbSchema } from "@/components/seo/JsonLd";
import { toast } from "sonner";
import logoMentoria from "@/assets/logo-mentoria-new.png";
import logoCursoIdea from "@/assets/logo-curso-idea-new.png";
import logoConsultoria from "@/assets/logo-consultoria-new.png";
import logoGuiaIA from "@/assets/logo-guia-ia-new.png";
import logoCodigoPrompts from "@/assets/logo-codigo-prompts-new.png";
import logoComboEbooks from "@/assets/logo-combo-ebooks-new.png";
import logoEggNunes from "@/assets/logo-eggnunes.png";
import logoRobodetoga from "@/assets/logo-robodetoga.png";
import logoVagasjuridicas from "@/assets/logo-vagasjuridicas.png";
import logoAITeleprompter from "@/assets/logo-ai-teleprompter.png";
import fotoRafael from "@/assets/foto-rafael.jpg";

export function HomePage() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleConsultoriaClick = () => {
    window.scrollTo(0, 0);
  };

  const products = [
    {
      title: "Consultoria IDEA",
      description: "Consultoria personalizada em IA para escritórios de advocacia",
      icon: Target,
      link: "/consultoria",
      logo: logoConsultoria,
      highlight: true,
      external: false,
      onClick: handleConsultoriaClick
    },
    {
      title: "Mentoria",
      description: "Acompanhamento personalizado para advogados que querem dominar a IA",
      icon: Users,
      link: "https://mentoriarafaelegg.com.br/inscricoes-abertas/",
      logo: logoMentoria,
      highlight: true,
      external: true
    },
    {
      title: "Curso IDEA",
      description: "Formação completa em Inteligência de Dados e Artificial para advogados",
      icon: GraduationCap,
      link: "https://mentoriarafaelegg.com.br/curso-idea/",
      logo: logoCursoIdea,
      highlight: true,
      external: true
    },
    {
      title: "Guia de IA",
      description: "Guia prático para começar a usar IA na advocacia",
      icon: BookOpen,
      link: "https://mentoriarafaelegg.com.br/guia-de-ia/",
      logo: logoGuiaIA,
      highlight: false,
      external: true
    },
    {
      title: "Código dos Prompts",
      description: "E-book com os melhores prompts para advogados",
      icon: Lightbulb,
      link: "https://mentoriarafaelegg.com.br/codigo-dos-prompts/",
      logo: logoCodigoPrompts,
      highlight: false,
      external: true
    },
    {
      title: "Combo de E-books",
      description: "Pacote completo com todos os e-books sobre IA na advocacia",
      icon: BookOpen,
      link: "https://mentoriarafaelegg.com.br/combo-de-ebooks/",
      logo: logoComboEbooks,
      highlight: false,
      external: true
    }
  ];

  const achievements = [
    { number: "3", label: "E-books Publicados" },
    { number: "500+", label: "Advogados Capacitados" },
    { number: "15+", label: "Anos de Advocacia" },
    { number: "50+", label: "Escritórios Atendidos" }
  ];

  const faqItems = [
    {
      question: "Quais produtos e serviços vocês oferecem?",
      answer: "Oferecemos uma gama completa de soluções para advogados: Consultoria IDEA (implementação personalizada de IA), Mentoria Coletiva e Individual, Curso IDEA (formação completa em IA), Guia de IA para Advogados, Código de Prompts e Combo de E-books. Cada produto atende diferentes necessidades e níveis de experiência."
    },
    {
      question: "Qual a diferença entre consultoria, mentoria e curso?",
      answer: "O Curso IDEA ensina conceitos e técnicas de forma estruturada. A Mentoria oferece acompanhamento em grupo ou individual para tirar dúvidas e evoluir. A Consultoria é a implementação prática e personalizada de IA diretamente no seu escritório, trabalhando a quatro mãos."
    },
    {
      question: "Preciso ter conhecimento prévio em tecnologia?",
      answer: "Não! Todos os produtos são projetados para advogados de qualquer nível de familiaridade com tecnologia. Começamos do básico e evoluímos juntos, sempre respeitando seu ritmo de aprendizado."
    },
    {
      question: "Os e-books podem ser adquiridos separadamente?",
      answer: "Sim! Os e-books estão disponíveis tanto individualmente quanto em combo com desconto. São excelentes para quem quer começar a estudar IA na advocacia de forma autodidata e no seu próprio ritmo."
    },
    {
      question: "Quais resultados posso esperar?",
      answer: "Nossos clientes relatam aumento de até 60% na produtividade, redução significativa no tempo de elaboração de peças, melhoria no atendimento ao cliente e maior organização do escritório com o uso de IA."
    },
    {
      question: "Como escolher o produto ideal para mim?",
      answer: "Para iniciantes, recomendamos os e-books ou o Curso IDEA. Para quem quer acompanhamento, a Mentoria é ideal. Para implementação completa e personalizada, a Consultoria IDEA oferece o melhor custo-benefício a longo prazo."
    },
    {
      question: "Vocês oferecem suporte?",
      answer: "Sim! Todos os produtos incluem canais de suporte para tirar dúvidas. Na consultoria e mentoria, o acompanhamento é contínuo durante todo o período contratado."
    },
    {
      question: "Como funciona o pagamento?",
      answer: "Oferecemos diversas formas de pagamento, incluindo cartão de crédito parcelado, PIX e boleto. Para consultorias e mentorias, também trabalhamos com planos mensais."
    }
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: contactForm
      });

      if (error) throw error;

      toast.success("Mensagem enviada com sucesso! Entrarei em contato em breve.");
      setContactForm({ name: "", email: "", phone: "", message: "" });
    } catch (error: any) {
      console.error("Error sending contact email:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      <SEOHead
        title="Rafael Egg - IA para Advogados | Consultoria, Mentoria e Cursos"
        description="Rafael Egg - Especialista em Inteligência Artificial para Advogados. Consultoria IDEA, Mentoria, Cursos e E-books para transformar sua advocacia com IA."
        canonical="https://rafaelegg.com/"
        schemaJson={[
          personSchema,
          organizationSchema,
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Rafael Egg - IA para Advogados",
            "url": "https://rafaelegg.com",
            "description": "Consultoria, mentoria e cursos de Inteligência Artificial para advogados e escritórios de advocacia.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://rafaelegg.com/blog?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          },
          generateFAQSchema(faqItems),
          generateBreadcrumbSchema([
            { name: "Início", url: "https://rafaelegg.com/" }
          ])
        ]}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#0f1419] to-[#1a1f2e]">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <nav className="relative z-10 container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoRE} alt="Rafael Egg" className="h-20 w-20 object-contain" />
              <span className="text-2xl font-bold text-white tracking-tight">Rafael Egg</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a 
                href="#sobre" 
                onClick={(e) => handleSmoothScroll(e, 'sobre')}
                className="text-slate-300 hover:text-amber-400 transition-colors duration-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-amber-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
              >
                Sobre
              </a>
              <a 
                href="#produtos" 
                onClick={(e) => handleSmoothScroll(e, 'produtos')}
                className="text-slate-300 hover:text-amber-400 transition-colors duration-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-amber-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
              >
                Produtos
              </a>
              <a 
                href="#faq" 
                onClick={(e) => handleSmoothScroll(e, 'faq')}
                className="text-slate-300 hover:text-amber-400 transition-colors duration-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-amber-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
              >
                FAQ
              </a>
              <Link 
                to="/blog"
                className="text-slate-300 hover:text-amber-400 transition-colors duration-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-amber-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
              >
                Blog
              </Link>
              <a 
                href="#contato" 
                onClick={(e) => handleSmoothScroll(e, 'contato')}
                className="text-slate-300 hover:text-amber-400 transition-colors duration-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-amber-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
              >
                Contato
              </a>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-slate-900 border-slate-700 w-[280px]">
                <nav className="flex flex-col gap-6 mt-8">
                  <a 
                    href="#sobre" 
                    onClick={(e) => {
                      handleSmoothScroll(e, 'sobre');
                      setMobileMenuOpen(false);
                    }}
                    className="text-lg text-slate-300 hover:text-amber-400 transition-colors duration-300 font-medium"
                  >
                    Sobre
                  </a>
                  <a 
                    href="#produtos" 
                    onClick={(e) => {
                      handleSmoothScroll(e, 'produtos');
                      setMobileMenuOpen(false);
                    }}
                    className="text-lg text-slate-300 hover:text-amber-400 transition-colors duration-300 font-medium"
                  >
                    Produtos
                  </a>
                  <a 
                    href="#faq" 
                    onClick={(e) => {
                      handleSmoothScroll(e, 'faq');
                      setMobileMenuOpen(false);
                    }}
                    className="text-lg text-slate-300 hover:text-amber-400 transition-colors duration-300 font-medium"
                  >
                    FAQ
                  </a>
                  <Link 
                    to="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg text-slate-300 hover:text-amber-400 transition-colors duration-300 font-medium"
                  >
                    Blog
                  </Link>
                  <a 
                    href="#contato" 
                    onClick={(e) => {
                      handleSmoothScroll(e, 'contato');
                      setMobileMenuOpen(false);
                    }}
                    className="text-lg text-slate-300 hover:text-amber-400 transition-colors duration-300 font-medium"
                  >
                    Contato
                  </a>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30 font-semibold transition-all duration-300 hover:scale-105">
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
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-amber-500/40" 
                  asChild
                >
                  <a href="#produtos" onClick={(e) => handleSmoothScroll(e, 'produtos')}>
                    Conhecer Produtos
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 transition-all duration-300 hover:scale-105 hover:border-amber-500/50" 
                  asChild
                >
                  <a href="#sobre" onClick={(e) => handleSmoothScroll(e, 'sobre')}>Sobre Mim</a>
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <a 
                  href="https://www.instagram.com/rafaeleggnunes/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-pink-400 hover:bg-slate-700 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/20"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.tiktok.com/@rafaeleggnunes" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/20"
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
                  className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-700 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/20"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
                <a 
                  href="mailto:contato@rafaelegg.com" 
                  className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-amber-500/20"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="relative flex flex-col items-center gap-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur-2xl opacity-30 scale-110 group-hover:opacity-50 transition-opacity duration-500" />
                <img 
                  src={fotoRafael} 
                  alt="Rafael Egg - Mentor em IA para Advocacia"
                  className="relative w-64 h-80 md:w-72 md:h-96 object-cover object-top rounded-2xl shadow-2xl border-2 border-amber-500/30 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-amber-500/60"
                />
              </div>

              <div className="hidden md:grid grid-cols-2 gap-4 w-full max-w-sm">
                {achievements.map((item, index) => (
                  <div 
                    key={index} 
                    className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700 transition-all duration-300 hover:scale-105 hover:border-amber-500/50 hover:bg-slate-800/80"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
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
      <section id="sobre" className="py-20 bg-slate-900/50 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4 transition-all duration-300 hover:scale-105">Sobre</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Quem é Rafael Egg</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/10 group">
                <CardContent className="p-6 text-center">
                  <img src={logoRE} alt="Advogado" className="h-12 w-12 mx-auto mb-4 object-contain transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="text-lg font-semibold text-white mb-2">Advogado desde 2008</h3>
                  <p className="text-slate-400">Sócio do Egg Nunes Advogados, escritório especializado há 30 anos em servidores públicos</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/10 group">
                <CardContent className="p-6 text-center">
                  <Brain className="h-12 w-12 text-orange-500 mx-auto mb-4 transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="text-lg font-semibold text-white mb-2">Melhor em IA 2025</h3>
                  <p className="text-slate-400">Escritório premiado como Melhor em IA do Brasil pela Law Summit</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-400/10 group">
                <CardContent className="p-6 text-center">
                  <Award className="h-12 w-12 text-amber-400 mx-auto mb-4 transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="text-lg font-semibold text-white mb-2">Criador do Método IDEA</h3>
                  <p className="text-slate-400">Centenas de advogados capacitados a automatizarem e escalarem seus escritórios</p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-8 border border-amber-500/20 transition-all duration-300 hover:border-amber-500/40">
              <p className="text-lg text-slate-300 leading-relaxed">
                Sou Rafael Egg Nunes, advogado desde 2008, mentor em IA para advogados e sócio do 
                <strong className="text-amber-400"> Egg Nunes Advogados Associados</strong>, escritório fundado pela minha família 
                e especializado há 30 anos em causas de servidores públicos e concurseiros.
              </p>
              <p className="text-lg text-slate-300 leading-relaxed mt-4">
                Em 2025, nosso escritório foi premiado como <strong className="text-amber-400">Melhor Escritório em Inteligência 
                Artificial do Brasil</strong> pela Law Summit. Usando IA estrategicamente, conseguimos multiplicar o faturamento 
                em mais de <strong className="text-amber-400">10x</strong>, mantendo a qualidade e reduzindo drasticamente o trabalho operacional.
              </p>
              <p className="text-lg text-slate-300 leading-relaxed mt-4">
                Criei o <strong className="text-amber-400">Método IDEA</strong> (Inteligência de Dados e Artificial) e já ajudei 
                centenas de advogados a automatizarem rotinas, captarem clientes no automático e escalarem seus escritórios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Produtos Section */}
      <section id="produtos" className="py-20 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4 transition-all duration-300 hover:scale-105">Produtos & Serviços</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Soluções para sua Advocacia</h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
              Conheça as ferramentas e serviços que vão transformar a forma como você pratica advocacia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <Card 
                key={index} 
                className={`bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10 ${
                  product.highlight ? 'ring-2 ring-amber-500/30' : ''
                }`}
              >
                <CardContent className="p-6">
                {product.logo ? (
                    <div className="h-20 mb-4 flex items-center justify-center">
                      <img 
                        src={product.logo} 
                        alt={product.title} 
                        className="h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <product.icon className="h-12 w-12 text-amber-500 mb-4 group-hover:text-orange-500 transition-all duration-300 group-hover:scale-110" />
                  )}
                  <h3 className="text-xl font-semibold text-white mb-2">{product.title}</h3>
                  <p className="text-slate-400 mb-4">{product.description}</p>
                  <Button 
                    variant="ghost" 
                    className="text-amber-500 hover:text-orange-500 hover:bg-amber-500/10 p-0 transition-all duration-300 group-hover:translate-x-1"
                    asChild
                  >
                    {product.external ? (
                      <a href={product.link} target="_blank" rel="noopener noreferrer">
                        Saiba mais
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    ) : (
                      <Link to={product.link} onClick={product.onClick}>
                        Saiba mais
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Outros Projetos Section */}
      <section id="projetos" className="py-20 bg-slate-900/50 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Outros Projetos</h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
              Conheça outras iniciativas e plataformas que desenvolvi para o universo jurídico
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* AI Teleprompter */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center">
                    <img src={logoAITeleprompter} alt="AI Teleprompter" className="h-full w-full object-contain rounded-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">AI Teleprompter</h3>
                    <p className="text-cyan-400 text-sm">App Store</p>
                  </div>
                </div>
                <p className="text-slate-400 mb-4">
                  Aplicativo para gravar vídeos com uma janela flutuante posicionável próxima à câmera. 
                  A IA reconhece sua voz e rola o texto automaticamente no seu ritmo, permitindo gravar olhando para a câmera.
                </p>
                <Button 
                  variant="ghost" 
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-0 transition-all duration-300 group-hover:translate-x-1"
                  asChild
                >
                  <a href="https://apps.apple.com/br/app/ai-teleprompter/id6756862906" target="_blank" rel="noopener noreferrer">
                    Baixar na App Store
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Antigolpe Advogado */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Shield className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Antigolpe Advogado</h3>
                    <p className="text-blue-400 text-sm">antigolpeadvogado.com.br</p>
                  </div>
                </div>
                <p className="text-slate-400 mb-4">
                  Plataforma gratuita para consultar e denunciar números de WhatsApp usados no golpe do falso advogado. 
                  Proteja-se verificando se um número já foi reportado como golpe antes de fazer qualquer pagamento.
                </p>
                <Button 
                  variant="ghost" 
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-0 transition-all duration-300 group-hover:translate-x-1"
                  asChild
                >
                  <a href="https://antigolpeadvogado.com.br" target="_blank" rel="noopener noreferrer">
                    Acessar plataforma
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Vagas Jurídicas */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-orange-500/50 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-auto flex items-center">
                    <img src={logoVagasjuridicas} alt="Vagas Jurídicas" className="h-full w-auto object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Vagas Jurídicas</h3>
                    <p className="text-orange-400 text-sm">vagasjuridicas.com</p>
                  </div>
                </div>
                <p className="text-slate-400 mb-4">
                  Portal especializado em oportunidades no mercado jurídico. Conectamos advogados, estagiários e 
                  profissionais do Direito às melhores vagas em escritórios e empresas de todo o Brasil.
                </p>
                <Button 
                  variant="ghost" 
                  className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 p-0 transition-all duration-300 group-hover:translate-x-1"
                  asChild
                >
                  <a href="https://vagasjuridicas.com" target="_blank" rel="noopener noreferrer">
                    Buscar vagas
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Robô de Toga */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-20 w-20 flex-shrink-0 flex items-center justify-center">
                    <img src={logoRobodetoga} alt="Robô de Toga" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Robô de Toga</h3>
                    <p className="text-purple-400 text-sm">robodetoga.com.br</p>
                  </div>
                </div>
                <p className="text-slate-400 mb-4">
                  Portal completo de IA para advogados com notícias atualizadas diariamente, ferramentas gratuitas 
                  (conversor PDF, OCR, calculadora de prazos), agentes IA especializados, pesquisa jurisprudencial, 
                  gerador de petições e muito mais.
                </p>
                <Button 
                  variant="ghost" 
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-0 transition-all duration-300 group-hover:translate-x-1"
                  asChild
                >
                  <a href="https://robodetoga.com.br" target="_blank" rel="noopener noreferrer">
                    Explorar portal
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Egg Nunes Advocacia */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-auto flex items-center">
                    <img src={logoEggNunes} alt="EGG Nunes Advogados" className="h-full w-auto object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Egg Nunes Advogados Associados</h3>
                    <p className="text-amber-400 text-sm">eggnunes.com.br</p>
                  </div>
                </div>
                <p className="text-slate-400 mb-4">
                  Escritório de advocacia referência desde 1994 com atuação em todo Brasil, especializado em 
                  Direito do Servidor Público. Atuamos em isenção de IR para aposentados, férias-prêmio, direito previdenciário militar e concursos públicos.
                </p>
                <Button 
                  variant="ghost" 
                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-0 transition-all duration-300 group-hover:translate-x-1"
                  asChild
                >
                  <a href="https://eggnunes.com.br" target="_blank" rel="noopener noreferrer">
                    Conhecer escritório
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-900/50 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4 transition-all duration-300 hover:scale-105">
                <HelpCircle className="w-3 h-3 mr-1" />
                Perguntas Frequentes
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Tire suas Dúvidas</h2>
              <p className="text-slate-400 mt-4">
                Respostas para as perguntas mais comuns sobre a consultoria e os produtos
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl px-6 transition-all duration-300 hover:border-amber-500/50 data-[state=open]:border-amber-500/50 data-[state=open]:shadow-lg data-[state=open]:shadow-amber-500/10"
                >
                  <AccordionTrigger className="text-white hover:text-amber-400 transition-colors duration-300 py-4 text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400 pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contato" className="py-20 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4 transition-all duration-300 hover:scale-105">
                <Mail className="w-3 h-3 mr-1" />
                Contato
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Entre em Contato</h2>
              <p className="text-slate-400 mt-4">
                Tem alguma dúvida ou quer saber mais sobre meus produtos e serviços? Envie uma mensagem!
              </p>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-8">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300">Nome *</Label>
                      <Input
                        id="name"
                        placeholder="Seu nome completo"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Telefone (opcional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-slate-300">Mensagem *</Label>
                    <Textarea
                      id="message"
                      placeholder="Escreva sua mensagem..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 min-h-[150px]"
                      required
                    />
                  </div>

                  <Button 
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
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
            Comece agora sua jornada de transformação digital com a Consultoria IDEA
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30" 
              asChild
            >
              <Link to="/consultoria" onClick={handleConsultoriaClick}>
                Agendar Consultoria
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105" 
              asChild
            >
              <a href="#contato" onClick={(e) => handleSmoothScroll(e, 'contato')}>
                <Mail className="mr-2 h-4 w-4" />
                Entrar em Contato
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoRE} alt="Rafael Egg" className="h-16 w-16 object-contain" />
                <span className="text-xl font-bold text-white">Rafael Egg</span>
              </div>
              <p className="text-slate-400">
                Mentor em Inteligência Artificial para Advocacia
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Links Rápidos</h4>
              <ul className="space-y-2">
                <li><a href="/consultoria" className="text-slate-400 hover:text-amber-500 transition-colors duration-300">Consultoria</a></li>
                <li><a href="https://mentoriarafaelegg.com.br/curso-idea/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-amber-500 transition-colors duration-300">Curso IDEA</a></li>
                <li><Link to="/blog" className="text-slate-400 hover:text-amber-500 transition-colors duration-300">Blog</Link></li>
                <li><a href="https://mentoriarafaelegg.com.br/combo-de-ebooks/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-amber-500 transition-colors duration-300">E-books</a></li>
                <li><a href="/privacidade" className="text-slate-400 hover:text-amber-500 transition-colors duration-300">Política de Privacidade</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Redes Sociais</h4>
              <div className="flex gap-3">
                <a 
                  href="https://www.instagram.com/rafaeleggnunes/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-pink-400 hover:bg-slate-700 transition-all duration-300 hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.tiktok.com/@rafaeleggnunes" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300 hover:scale-110"
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
                  className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-700 transition-all duration-300 hover:scale-110"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400">&copy; {new Date().getFullYear()} Rafael Egg. Todos os direitos reservados.</p>
            <Link 
              to="/metodo-idea" 
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors duration-300 flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
