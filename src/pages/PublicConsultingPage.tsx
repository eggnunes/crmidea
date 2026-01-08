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
  Menu
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { CONSULTING_FEATURES, FEATURE_CATEGORIES } from "@/data/consultingFeatures";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import logoConsultoria from "@/assets/logo-consultoria.png";
import logoRE from "@/assets/logo-re.png";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

// ID do consultor padrão - em produção, isso poderia ser dinâmico
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

export function PublicConsultingPage() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCadastro = () => {
    if (user) {
      navigate('/area-cliente');
    } else {
      navigate(`/cadastro-cliente/${DEFAULT_CONSULTANT_ID}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <nav className="container mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img 
                  src={logoConsultoria} 
                  alt="Consultoria IDEA" 
                  className="h-8 md:h-10 w-auto object-contain"
                />
                <span className="font-bold text-lg md:text-xl hidden sm:inline">Consultoria IDEA</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              {isAdmin && (
                <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                  <Link to="/consultoria" title="Área Administrativa">
                    <Settings className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild className="gap-2">
                <Link to="/consultoria/login">
                  <LogIn className="w-4 h-4" />
                  Área do Cliente
                </Link>
              </Button>
              <Button asChild>
                <a href="https://mentoriarafaelegg.com.br/consultoria-idea/" target="_blank" rel="noopener noreferrer">
                  Contratar Consultoria
                </a>
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2">
              {isAdmin && (
                <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                  <Link to="/consultoria" title="Área Administrativa">
                    <Settings className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col gap-4 mt-8">
                    <Button variant="outline" asChild className="gap-2 justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <Link to="/consultoria/login">
                        <LogIn className="w-4 h-4" />
                        Área do Cliente
                      </Link>
                    </Button>
                    <Button asChild onClick={() => setMobileMenuOpen(false)}>
                      <a href="https://mentoriarafaelegg.com.br/consultoria-idea/" target="_blank" rel="noopener noreferrer">
                        Contratar Consultoria
                      </a>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
        
        <div className="container mx-auto px-4 py-16 md:py-20 text-center relative z-10">
          <Badge className="mb-4" variant="secondary">
            Consultoria em Inteligência Artificial para Advogados
          </Badge>
          
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-6 leading-tight">
            Transforme seu escritório com{" "}
            <span className="text-primary">Inteligência Artificial</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Consultoria personalizada para advogados que querem implementar IA de forma prática e eficiente. 
            Trabalho a quatro mãos, do diagnóstico à autonomia total.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" asChild>
              <Link to="/consultoria/login">
                <LogIn className="w-4 h-4" />
                Área do Cliente
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="#como-funciona">
                Saiba Mais
              </a>
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-12">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm">Implementação Personalizada</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm">Suporte Contínuo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm">Autonomia Total</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Por que escolher a Consultoria IDEA?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma metodologia única que combina implementação prática com transferência de conhecimento
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it Works Section */}
      <section id="como-funciona" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Como Funciona a Consultoria</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Um processo estruturado em 6 etapas para garantir sua transformação digital
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground font-bold">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* All 50 Features Section */}
      <section id="funcionalidades" className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              50 Funcionalidades Disponíveis
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              Tudo que você pode implementar no seu escritório
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
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
                  className="bg-background rounded-lg border px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{categoryFeatures.length} funcionalidades</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4 pb-4">
                      {categoryFeatures.map((feature) => (
                        <Card key={feature.id} className="border-l-4 border-l-primary/50">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                                {feature.id}
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">{feature.name}</h4>
                                <p className="text-xs text-muted-foreground">{feature.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          
          <div className="text-center mt-8">
            <Button size="lg" className="gap-2" asChild>
              <a href="https://mentoriarafaelegg.com.br/consultoria-idea/" target="_blank" rel="noopener noreferrer">
                <ArrowRight className="w-4 h-4" />
                Contratar Consultoria
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Lovable Plans Section */}
      <section id="planos-lovable" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              <CreditCard className="w-3 h-3 mr-1" />
              Plataforma de Desenvolvimento
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Como Funciona o Lovable</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              O Lovable é a plataforma de IA que utilizamos para criar sistemas personalizados. 
              Entenda como funcionam os planos e créditos.
            </p>
          </div>

          {/* Explanation Card */}
          <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    O que são Créditos?
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Cada interação com a IA do Lovable consome créditos. Perguntas simples consomem 1 crédito, 
                    enquanto tarefas complexas podem consumir mais. Os créditos são sua "moeda" para construir 
                    e modificar seu sistema.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Créditos diários renovam a cada 24h
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Créditos mensais acumulam se não usados (planos pagos)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Você pode comprar créditos adicionais se necessário
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Recomendação para Advogados
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Para a maioria dos advogados e pequenos escritórios, o <strong>plano Pro ($25/mês)</strong> é 
                    suficiente para manter e evoluir seu sistema após a consultoria. Você terá 100 créditos 
                    mensais + 5 diários para fazer ajustes e adicionar funcionalidades.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Durante a consultoria, orientamos como usar os créditos de forma eficiente e como 
                    estruturar seus prompts para obter os melhores resultados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-3 gap-6">
            {lovablePlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.recommended ? 'border-2 border-primary shadow-lg' : ''}`}>
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Recomendado</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">{plan.price}</div>
                  <p className="text-sm text-muted-foreground">{plan.credits}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center mb-4">{plan.description}</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Para mais informações sobre preços e planos, acesse o site oficial do Lovable
            </p>
            <Button variant="outline" asChild>
              <a href="https://lovable.dev/pricing" target="_blank" rel="noopener noreferrer">
                Ver Preços Atualizados
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="secondary">
                <HelpCircle className="w-3 h-3 mr-1" />
                Perguntas Frequentes
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Tire suas Dúvidas sobre a Consultoria</h2>
              <p className="text-muted-foreground">
                Respostas para as perguntas mais comuns sobre a Consultoria IDEA
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {consultingFaqItems.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-background border rounded-xl px-6"
                >
                  <AccordionTrigger className="hover:no-underline py-4 text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para transformar seu escritório?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Agende uma conversa e descubra como a IA pode revolucionar sua advocacia. 
            Vagas limitadas para garantir atendimento personalizado.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <Link to="/consultoria/login">
                <LogIn className="w-4 h-4" />
                Área do Cliente
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
              <a href="https://mentoriarafaelegg.com.br/consultoria-idea/" target="_blank" rel="noopener noreferrer">
                Contratar Consultoria
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 mt-8 text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Resposta em até 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              <span className="text-sm">Consultoria Personalizada</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">+50 Escritórios Atendidos</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t bg-slate-900">
        <div className="container mx-auto px-4">
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
            <p>© {new Date().getFullYear()} Rafael Egg. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
