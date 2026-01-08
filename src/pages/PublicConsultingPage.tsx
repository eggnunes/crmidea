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
  HelpCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CONSULTING_FEATURES, FEATURE_CATEGORIES } from "@/data/consultingFeatures";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import logoConsultoria from "@/assets/logo-consultoria.png";

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

const testimonials = [
  {
    name: "Dr. Carlos Silva",
    office: "Silva & Associados",
    text: "A consultoria transformou completamente a forma como trabalhamos. Reduzimos em 60% o tempo gasto em tarefas administrativas.",
    rating: 5
  },
  {
    name: "Dra. Marina Santos",
    office: "Santos Advocacia",
    text: "Finalmente consegui implementar IA no meu escritório de forma prática e eficiente. O suporte foi excepcional.",
    rating: 5
  },
  {
    name: "Dr. Roberto Lima",
    office: "Lima & Partners",
    text: "A metodologia a quatro mãos fez toda a diferença. Hoje domino as ferramentas e continuo evoluindo sozinho.",
    rating: 5
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
  }
];

export function PublicConsultingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src={logoConsultoria} 
                alt="Consultoria IDEA" 
                className="h-10 w-auto object-contain"
              />
              <span className="font-bold text-xl">Consultoria IDEA</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
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
        </nav>
        
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <Badge className="mb-4" variant="secondary">
            Consultoria em Inteligência Artificial para Advogados
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Transforme seu escritório com{" "}
            <span className="text-primary">Inteligência Artificial</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
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
          
          <div className="flex flex-wrap justify-center gap-8 mt-12">
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
      
      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">O que dizem nossos clientes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Advogados que transformaram seus escritórios com a consultoria IDEA
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.office}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
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
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">IDEA - Inteligência Artificial para Advogados</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} IDEA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
