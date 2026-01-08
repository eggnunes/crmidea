import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  GraduationCap
} from "lucide-react";
import { Link } from "react-router-dom";

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

const features = [
  "Assistente virtual inteligente para atendimento 24h",
  "Geração automática de petições e documentos",
  "Pesquisa de jurisprudência com IA",
  "Gestão de processos automatizada",
  "Controle financeiro inteligente",
  "Comunicação automatizada com clientes",
  "Dashboard de métricas e KPIs",
  "Gestão de equipe e colaboradores",
  "Integração com sistemas jurídicos",
  "Organização automática de documentos"
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

export function PublicConsultingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">IDEA</span>
          </div>
          <Button asChild>
            <a href="https://crmidea.lovable.app" target="_blank" rel="noopener noreferrer">
              Contratar Consultoria
            </a>
          </Button>
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
              <a href="https://crmidea.lovable.app" target="_blank" rel="noopener noreferrer">
                Quero a Consultoria
                <ArrowRight className="w-4 h-4" />
              </a>
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
      
      {/* Features Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                O que você pode implementar no seu escritório
              </h2>
              <p className="text-muted-foreground mb-8">
                Funcionalidades testadas e aprovadas em escritórios de advocacia reais. 
                Você escolhe o que faz sentido para sua realidade.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button className="mt-8 gap-2" asChild>
                <a href="https://crmidea.lovable.app" target="_blank" rel="noopener noreferrer">
                  Ver Todas as Funcionalidades
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Atendimento Automatizado</h4>
                    <p className="text-sm text-muted-foreground">Responda clientes 24h com IA</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center">
                    <FileText className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Petições com IA</h4>
                    <p className="text-sm text-muted-foreground">Gere documentos em minutos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Gestão Inteligente</h4>
                    <p className="text-sm text-muted-foreground">Prazos e processos sob controle</p>
                  </div>
                </div>
              </div>
            </div>
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
              <a href="https://crmidea.lovable.app" target="_blank" rel="noopener noreferrer">
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
              <span className="text-sm">Diagnóstico Gratuito</span>
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
