import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  CheckCircle2, 
  Users, 
  Brain, 
  Target, 
  Rocket,
  MessageSquare,
  Calendar,
  FileText,
  Bot,
  ArrowRight,
  Star,
  Clock,
  Lightbulb,
  Handshake,
  GraduationCap,
  UserPlus,
  ChevronDown,
  LogIn,
  HelpCircle,
  Instagram,
  Youtube,
  Settings,
  CreditCard,
  Menu,
  Shield,
  Play,
  Sparkles,
  TrendingUp,
  Award
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { CONSULTING_FEATURES, FEATURE_CATEGORIES } from "@/data/consultingFeatures";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import logoConsultoria from "@/assets/logo-consultoria.png";
import logoRE from "@/assets/logo-re.png";
import rafaelPhoto from "@/assets/rafael-consulting-nobg.png";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const DEFAULT_CONSULTANT_ID = "default";

const benefits = [
  {
    icon: Brain,
    title: "Diagnóstico Personalizado",
    description: "Análise completa das necessidades do seu escritório para criar um plano de implementação sob medida."
  },
  {
    icon: Handshake,
    title: "Implementação a Quatro Mãos",
    description: "Trabalho conjunto para implantar a IA no seu escritório. Você aprende fazendo, ao meu lado."
  },
  {
    icon: GraduationCap,
    title: "Autonomia Total",
    description: "Ao final da consultoria, você terá domínio completo das ferramentas e poderá continuar evoluindo sozinho."
  },
  {
    icon: Bot,
    title: "IA Aplicada ao Direito",
    description: "Soluções específicas para advogados: petições, jurisprudência, atendimento ao cliente e muito mais."
  },
  {
    icon: Rocket,
    title: "Aumento de Produtividade",
    description: "Automatize tarefas repetitivas e foque no que realmente importa: seus clientes e suas causas."
  },
  {
    icon: Target,
    title: "Resultados Mensuráveis",
    description: "Métricas claras de evolução do seu escritório ao longo da consultoria."
  }
];

const steps = [
  {
    number: "01",
    title: "Diagnóstico",
    description: "Preenchimento do formulário de diagnóstico para entender suas necessidades específicas."
  },
  {
    number: "02",
    title: "Plano Personalizado",
    description: "Criação de um plano de implementação com base no diagnóstico realizado."
  },
  {
    number: "03",
    title: "Implementação",
    description: "Sessões de trabalho conjunto para implantar cada funcionalidade no seu escritório."
  },
  {
    number: "04",
    title: "Treinamento",
    description: "Ensino prático para que você domine todas as ferramentas implementadas."
  },
  {
    number: "05",
    title: "Acompanhamento",
    description: "Suporte contínuo para tirar dúvidas e ajustar as implementações."
  },
  {
    number: "06",
    title: "Autonomia",
    description: "Você continua evoluindo sozinho, com todo o conhecimento adquirido."
  }
];

const lovablePlans = [
  {
    name: "Free",
    price: "Grátis",
    credits: "5 créditos diários",
    description: "Ideal para explorar e testar a plataforma",
    features: [
      "5 créditos diários (máx 30/mês)",
      "Domínio lovable.app",
      "Funcionalidades básicas"
    ]
  },
  {
    name: "Pro",
    price: "$25/mês",
    credits: "100 créditos + 5 diários",
    description: "Perfeito para projetos individuais e pequenos escritórios",
    features: [
      "100 créditos mensais",
      "5 créditos diários (até 150/mês)",
      "Rollover de créditos não usados",
      "Domínio personalizado",
      "Remover badge do Lovable",
      "Cloud + IA sob demanda"
    ],
    recommended: true
  },
  {
    name: "Business",
    price: "$100/mês",
    credits: "500 créditos + 10 diários",
    description: "Para equipes e escritórios maiores",
    features: [
      "500 créditos mensais",
      "10 créditos diários (até 300/mês)",
      "Tudo do Pro",
      "SSO e gestão de usuários",
      "Permissões granulares",
      "Suporte prioritário"
    ]
  }
];

const consultingFaqItems = [
  {
    question: "O que é a Consultoria IDEA?",
    answer: "A Consultoria IDEA é um serviço personalizado de implementação de Inteligência Artificial em escritórios de advocacia. Trabalhamos a quatro mãos para implantar soluções de IA que aumentam a produtividade e eficiência do seu escritório."
  },
  {
    question: "Quanto tempo dura a consultoria?",
    answer: "A duração varia de acordo com o plano escolhido e as necessidades do seu escritório. Temos opções que vão de 3 a 12 meses de acompanhamento, sempre focando em garantir sua autonomia total ao final do processo."
  },
  {
    question: "Preciso ter conhecimento prévio em tecnologia?",
    answer: "Não! A consultoria é projetada para advogados de todos os níveis de familiaridade com tecnologia. Começamos do básico e evoluímos juntos, sempre respeitando seu ritmo de aprendizado."
  },
  {
    question: "Como funcionam as sessões de consultoria?",
    answer: "As sessões são realizadas online, em horários flexíveis. Cada encontro é focado em implementar funcionalidades específicas no seu escritório, com acompanhamento prático e suporte contínuo entre as sessões."
  },
  {
    question: "Quais são os resultados esperados?",
    answer: "Nossos clientes relatam aumento de até 60% na produtividade, redução significativa no tempo de elaboração de peças, melhoria no atendimento ao cliente e maior organização do escritório."
  },
  {
    question: "O que está incluído na consultoria?",
    answer: "A consultoria inclui: diagnóstico inicial completo, plano personalizado de implementação, sessões de trabalho conjunto, treinamento prático, suporte contínuo via WhatsApp, acesso à área exclusiva do cliente e materiais complementares."
  },
  {
    question: "Posso escolher quais funcionalidades implementar?",
    answer: "Sim! Você participa ativamente da escolha das funcionalidades. Com base no diagnóstico inicial, identificamos as prioridades do seu escritório e criamos um plano personalizado com as funcionalidades mais relevantes para você."
  },
  {
    question: "Vocês oferecem suporte após a consultoria?",
    answer: "Sim! Oferecemos canais de suporte para tirar dúvidas mesmo após o término da consultoria. Nosso objetivo é garantir que você tenha autonomia total para continuar evoluindo sozinho."
  },
  {
    question: "Como faço para contratar?",
    answer: "Você pode contratar diretamente pelo botão 'Contratar Consultoria' nesta página. Após a contratação, você terá acesso à área do cliente e preencherá o formulário de diagnóstico para iniciarmos o trabalho."
  },
  {
    question: "Qual o investimento para a consultoria?",
    answer: "O investimento varia de acordo com o plano escolhido (duração e intensidade). Entre em contato para conhecer as opções disponíveis e escolher a que melhor se adapta à sua realidade."
  },
  {
    question: "O que é o Lovable e como funciona?",
    answer: "O Lovable é a plataforma de IA que utilizamos para criar sistemas personalizados para advogados. Ela permite criar aplicações completas usando linguagem natural, sem necessidade de conhecimento de programação. Cada interação consome créditos, que são renovados diariamente e mensalmente."
  },
  {
    question: "Preciso ter uma assinatura do Lovable?",
    answer: "Sim, para implementar e manter seu sistema você precisará de uma assinatura. Recomendamos o plano Pro ($25/mês) para a maioria dos advogados individuais e pequenos escritórios. Orientamos todo o processo de assinatura e uso da plataforma durante a consultoria."
  }
];

const stats = [
  { value: "50+", label: "Escritórios Atendidos" },
  { value: "10x", label: "Aumento de Produtividade" },
  { value: "50+", label: "Funcionalidades Disponíveis" }
];

export function PublicConsultingPage() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(222,47%,5%)] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[hsl(222,47%,5%)]/80 border-b border-white/5">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img 
                src={logoConsultoria} 
                alt="Consultoria IDEA" 
                className="h-8 md:h-10 w-auto object-contain"
              />
              <span className="font-bold text-lg hidden sm:inline text-white">Consultoria IDEA</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#beneficios" className="text-sm text-white/70 hover:text-white transition-colors">Benefícios</a>
              <a href="#como-funciona" className="text-sm text-white/70 hover:text-white transition-colors">Como Funciona</a>
              <a href="#funcionalidades" className="text-sm text-white/70 hover:text-white transition-colors">Funcionalidades</a>
              <a href="#faq" className="text-sm text-white/70 hover:text-white transition-colors">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {isAdmin && (
                <Button variant="ghost" size="icon" asChild className="text-white/70 hover:text-white hover:bg-white/10">
                  <Link to="/consultoria" title="Área Administrativa">
                    <Settings className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" asChild className="gap-2 text-white/70 hover:text-white hover:bg-white/10">
                <Link to="/consultoria/login">
                  <LogIn className="w-4 h-4" />
                  Área do Cliente
                </Link>
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0" asChild>
                <a href="https://mentoriarafaelegg.com.br/consultoria-idea/" target="_blank" rel="noopener noreferrer">
                  Contratar
                </a>
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2">
              {isAdmin && (
                <Button variant="ghost" size="icon" asChild className="text-white/70 hover:text-white">
                  <Link to="/consultoria" title="Área Administrativa">
                    <Settings className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-[hsl(222,47%,8%)] border-white/10">
                  <div className="flex flex-col gap-4 mt-8">
                    <a href="#beneficios" className="text-white/70 hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Benefícios</a>
                    <a href="#como-funciona" className="text-white/70 hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Como Funciona</a>
                    <a href="#funcionalidades" className="text-white/70 hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</a>
                    <a href="#faq" className="text-white/70 hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                    <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
                      <Button variant="outline" asChild className="w-full gap-2 justify-start border-white/20 text-white hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>
                        <Link to="/consultoria/login">
                          <LogIn className="w-4 h-4" />
                          Área do Cliente
                        </Link>
                      </Button>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600" asChild onClick={() => setMobileMenuOpen(false)}>
                        <a href="https://mentoriarafaelegg.com.br/consultoria-idea/" target="_blank" rel="noopener noreferrer">
                          Contratar Consultoria
                        </a>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[180px]" />
          
          {/* Subtle Neural Network Background */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="neural-pattern" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
                {/* Nodes - larger and more visible */}
                <circle cx="30" cy="30" r="3" fill="#3b82f6" opacity="0.8" />
                <circle cx="150" cy="60" r="3" fill="#8b5cf6" opacity="0.8" />
                <circle cx="270" cy="45" r="3" fill="#3b82f6" opacity="0.8" />
                <circle cx="75" cy="150" r="3" fill="#8b5cf6" opacity="0.8" />
                <circle cx="225" cy="135" r="3" fill="#3b82f6" opacity="0.8" />
                <circle cx="45" cy="255" r="3" fill="#3b82f6" opacity="0.8" />
                <circle cx="150" cy="225" r="3" fill="#8b5cf6" opacity="0.8" />
                <circle cx="255" cy="270" r="3" fill="#3b82f6" opacity="0.8" />
                <circle cx="120" cy="120" r="2.5" fill="#60a5fa" opacity="0.6" />
                <circle cx="200" cy="200" r="2.5" fill="#a78bfa" opacity="0.6" />
                {/* Connections - thicker lines */}
                <line x1="30" y1="30" x2="150" y2="60" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                <line x1="150" y1="60" x2="270" y2="45" stroke="#8b5cf6" strokeWidth="1" opacity="0.6" />
                <line x1="30" y1="30" x2="75" y2="150" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                <line x1="150" y1="60" x2="225" y2="135" stroke="#8b5cf6" strokeWidth="1" opacity="0.6" />
                <line x1="75" y1="150" x2="150" y2="225" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                <line x1="225" y1="135" x2="255" y2="270" stroke="#8b5cf6" strokeWidth="1" opacity="0.6" />
                <line x1="45" y1="255" x2="150" y2="225" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                <line x1="150" y1="225" x2="255" y2="270" stroke="#8b5cf6" strokeWidth="1" opacity="0.6" />
                <line x1="75" y1="150" x2="225" y2="135" stroke="#3b82f6" strokeWidth="0.8" opacity="0.4" />
                <line x1="270" y1="45" x2="225" y2="135" stroke="#8b5cf6" strokeWidth="0.8" opacity="0.4" />
                <line x1="120" y1="120" x2="150" y2="60" stroke="#60a5fa" strokeWidth="0.8" opacity="0.4" />
                <line x1="120" y1="120" x2="75" y2="150" stroke="#60a5fa" strokeWidth="0.8" opacity="0.4" />
                <line x1="200" y1="200" x2="225" y2="135" stroke="#a78bfa" strokeWidth="0.8" opacity="0.4" />
                <line x1="200" y1="200" x2="150" y2="225" stroke="#a78bfa" strokeWidth="0.8" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-pattern)" />
          </svg>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Award Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 mb-4">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-300 font-medium">🏆 Melhor Escritório de Advocacia com IA do Brasil</span>
              </div>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/80">Inteligência de Dados e Artificial</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="text-white">CONSULTORIA</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  IDEA
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl font-medium mb-4">
                <span className="text-blue-400">Multiplique por 10x sua produtividade</span>
                <span className="text-white"> e seu faturamento usando o poder da IA em todos os setores do seu escritório</span>
              </p>
              
              <p className="text-white/60 text-lg mb-8 max-w-xl">
                Receba uma consultoria de implementação completa onde "<span className="text-blue-400">pegamos na sua mão</span>" e implantamos a IA diretamente no seu escritório.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 text-lg px-8 py-6" asChild>
                  <a href="https://mentoriarafaelegg.com.br/consultoria-idea/" target="_blank" rel="noopener noreferrer">
                    EU QUERO A CONSULTORIA IDEA
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6" asChild>
                  <Link to="/consultoria/login">
                    <LogIn className="w-5 h-5" />
                    Área do Cliente
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-white/50">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo */}
            <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Glow Effect Behind Photo */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/30 via-purple-500/20 to-transparent blur-3xl scale-110" />
                
                {/* Photo Container */}
                <div className="relative">
                  <img 
                    src={rafaelPhoto} 
                    alt="Rafael Egg - Consultor de IA para Advogados"
                    className="w-full max-w-md lg:max-w-lg xl:max-w-xl h-auto relative z-10 drop-shadow-[0_0_80px_rgba(59,130,246,0.3)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white/30" />
        </div>
      </section>

      {/* Marquee Banner */}
      <div className="relative py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 overflow-hidden">
        <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-8">
              <span className="text-white font-semibold">✦ CONSULTORIA IDEA</span>
              <span className="text-white/80">Implementação de IA para Advogados</span>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section id="sobre" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222,47%,5%)] via-[hsl(222,47%,8%)] to-[hsl(222,47%,5%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/80">
                <Users className="w-3 h-3 mr-1" />
                Sobre o Consultor
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Conheça <span className="text-blue-400">Rafael Egg</span>
              </h2>
            </div>

            <Card className="bg-white/[0.02] border-white/5 overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-xl" />
                      <img 
                        src={rafaelPhoto} 
                        alt="Rafael Egg"
                        className="relative w-48 h-48 md:w-56 md:h-56 object-cover object-top rounded-full border-2 border-white/10"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 mb-4">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-yellow-300 font-medium">🏆 Prêmio Melhor Escritório com IA do Brasil</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4">Rafael Egg Nunes</h3>
                    
                    <div className="space-y-3 text-white/70 leading-relaxed">
                      <p>
                        <strong className="text-white">Advogado</strong> especializado em Direito Empresarial e Proteção de Dados, 
                        com mais de 10 anos de experiência.
                      </p>
                      <p>
                        <strong className="text-white">Especialista em Inteligência Artificial</strong> aplicada à advocacia, 
                        atuando na implementação de soluções de IA em escritórios de todo o Brasil.
                      </p>
                      <p>
                        <strong className="text-white">Criador do Método IDEA</strong> (Inteligência de Dados e Artificial), 
                        metodologia exclusiva para transformação digital de escritórios de advocacia.
                      </p>
                      <p>
                        <strong className="text-white">Professor e Palestrante</strong> sobre IA no Direito, tendo ministrado 
                        treinamentos para centenas de advogados em todo o país.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                      <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-300">
                        <Brain className="w-3 h-3 mr-1" />
                        IA para Advogados
                      </Badge>
                      <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        +50 Escritórios Atendidos
                      </Badge>
                      <Badge className="bg-green-500/20 border-green-500/30 text-green-300">
                        <Target className="w-3 h-3 mr-1" />
                        Método Comprovado
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222,47%,5%)] via-[hsl(222,47%,7%)] to-[hsl(222,47%,5%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/5 border-white/10 text-white/80">
              <Award className="w-3 h-3 mr-1" />
              Diferenciais
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Por que escolher a <span className="text-blue-400">Consultoria IDEA</span>?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Uma metodologia única que combina implementação prática com transferência de conhecimento
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/[0.02] border-white/5 hover:border-blue-500/30 transition-all duration-300 group hover:bg-white/[0.04]">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-5 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                    <benefit.icon className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3 text-white">{benefit.title}</h3>
                  <p className="text-white/60 leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it Works Section */}
      <section id="como-funciona" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[150px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/5 border-white/10 text-white/80">
              <Rocket className="w-3 h-3 mr-1" />
              Metodologia
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Como Funciona a <span className="text-blue-400">Consultoria</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Um processo estruturado em 6 etapas para garantir sua transformação digital
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 hover:bg-white/[0.04]">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                      <span className="text-white font-bold text-lg">{step.number}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl mb-2 text-white">{step.title}</h3>
                      <p className="text-white/60 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* All 50 Features Section */}
      <section id="funcionalidades" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222,47%,5%)] via-[hsl(222,47%,8%)] to-[hsl(222,47%,5%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 text-blue-400">
              <Sparkles className="w-3 h-3 mr-1" />
              Mais de 50 Funcionalidades Disponíveis
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Tudo que você pode <span className="text-blue-400">implementar</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Escolha as funcionalidades que fazem sentido para sua realidade. 
              Cada uma é implementada de forma personalizada para seu escritório.
            </p>
          </div>
          
          <Accordion type="multiple" className="space-y-4">
            {FEATURE_CATEGORIES.map((category) => {
              const categoryFeatures = CONSULTING_FEATURES.filter(f => f.category === category.id);
              return (
                <AccordionItem 
                  key={category.id} 
                  value={category.id}
                  className="bg-white/[0.02] rounded-2xl border border-white/5 px-6 data-[state=open]:border-blue-500/30 transition-all"
                >
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{category.icon}</span>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg text-white">{category.name}</h3>
                        <p className="text-sm text-white/50">{categoryFeatures.length} funcionalidades</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4 pb-6">
                      {categoryFeatures.map((feature) => (
                        <div key={feature.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-blue-500/20 transition-all">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-400">
                              {feature.id}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1 text-white">{feature.name}</h4>
                              <p className="text-xs text-white/50">{feature.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          
          <div className="text-center mt-12">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 text-lg px-8 py-6" asChild>
              <a href="https://mentoriarafaelegg.com.br/consultoria-idea/" target="_blank" rel="noopener noreferrer">
                <ArrowRight className="w-5 h-5" />
                Contratar Consultoria
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Lovable Plans Section */}
      <section id="planos-lovable" className="py-24 relative">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[150px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/5 border-white/10 text-white/80">
              <CreditCard className="w-3 h-3 mr-1" />
              Plataforma de Desenvolvimento
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Como Funciona o <span className="text-blue-400">Lovable</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              O Lovable é a plataforma de IA que utilizamos para criar sistemas personalizados. 
              Entenda como funcionam os planos e créditos.
            </p>
          </div>

          {/* Explanation Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-8 mb-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-xl mb-4 flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  O que são Créditos?
                </h3>
                <p className="text-white/60 mb-4 leading-relaxed">
                  Cada interação com a IA do Lovable consome créditos. Perguntas simples consomem 1 crédito, 
                  enquanto tarefas complexas podem consumir mais. Os créditos são sua "moeda" para construir 
                  e modificar seu sistema.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-white/70">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    Créditos diários renovam a cada 24h
                  </li>
                  <li className="flex items-center gap-3 text-white/70">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    Créditos mensais acumulam se não usados
                  </li>
                  <li className="flex items-center gap-3 text-white/70">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    Você pode comprar créditos adicionais
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-4 flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-purple-400" />
                  </div>
                  Recomendação para Advogados
                </h3>
                <p className="text-white/60 mb-4 leading-relaxed">
                  Para a maioria dos advogados e pequenos escritórios, o <strong className="text-blue-400">plano Pro ($25/mês)</strong> é 
                  suficiente para manter e evoluir seu sistema após a consultoria. Você terá 100 créditos 
                  mensais + 5 diários para fazer ajustes e adicionar funcionalidades.
                </p>
                <p className="text-white/60 leading-relaxed">
                  Durante a consultoria, orientamos como usar os créditos de forma eficiente e como 
                  estruturar seus prompts para obter os melhores resultados.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {lovablePlans.map((plan, index) => (
              <Card key={index} className={`relative bg-white/[0.02] border transition-all duration-300 ${plan.recommended ? 'border-blue-500/50 shadow-xl shadow-blue-500/10' : 'border-white/5 hover:border-white/10'}`}>
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 text-white px-4 py-1">
                      Recomendado
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-8">
                  <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {plan.price}
                  </div>
                  <p className="text-sm text-white/50">{plan.credits}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60 text-center mb-6">{plan.description}</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-white/50 mb-6">
              Para mais informações sobre preços e planos, acesse o site oficial do Lovable
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0" asChild>
                <a href="https://lovable.dev/invite/IX8ILR2" target="_blank" rel="noopener noreferrer">
                  Criar Conta no Lovable
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                <a href="https://lovable.dev/pricing" target="_blank" rel="noopener noreferrer">
                  Ver Preços Atualizados
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222,47%,5%)] via-[hsl(222,47%,7%)] to-[hsl(222,47%,5%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/80">
                <HelpCircle className="w-3 h-3 mr-1" />
                Perguntas Frequentes
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Tire suas <span className="text-blue-400">Dúvidas</span>
              </h2>
              <p className="text-white/60 text-lg">
                Respostas para as perguntas mais comuns sobre a Consultoria IDEA
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {consultingFaqItems.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white/[0.02] border border-white/5 rounded-2xl px-6 data-[state=open]:border-blue-500/30 transition-all"
                >
                  <AccordionTrigger className="hover:no-underline py-5 text-left text-white">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/60 pb-5 leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Pronto para transformar seu escritório?
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-10 text-lg">
            Agende uma conversa e descubra como a IA pode revolucionar sua advocacia. 
            Vagas limitadas para garantir atendimento personalizado.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="secondary" className="gap-2 bg-white text-blue-600 hover:bg-white/90 text-lg px-8 py-6" asChild>
              <a href="https://mentoriarafaelegg.com.br/consultoria-idea/" target="_blank" rel="noopener noreferrer">
                Contratar Consultoria
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6" asChild>
              <Link to="/consultoria/login">
                <LogIn className="w-5 h-5" />
                Área do Cliente
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Resposta em até 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              <span>Consultoria Personalizada</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>+50 Escritórios Atendidos</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[hsl(222,47%,4%)]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3">
              <img src={logoRE} alt="Rafael Egg" className="h-12 w-12 object-contain" />
              <span className="text-xl font-bold text-white">Rafael Egg</span>
            </Link>
            <div className="flex gap-3">
              <a 
                href="https://www.instagram.com/rafaeleggnunes/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 rounded-full bg-white/5 text-white/60 hover:text-pink-400 hover:bg-white/10 transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://www.tiktok.com/@rafaeleggnunes" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300"
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
                className="p-3 rounded-full bg-white/5 text-white/60 hover:text-red-400 hover:bg-white/10 transition-all duration-300"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p className="text-white/40">© {new Date().getFullYear()} Rafael Egg. Todos os direitos reservados.</p>
            <Link 
              to="/metodo-idea" 
              className="text-white/20 hover:text-white/40 text-xs transition-colors duration-300 flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              Admin
            </Link>
          </div>
        </div>
      </footer>

      {/* Custom CSS for marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
