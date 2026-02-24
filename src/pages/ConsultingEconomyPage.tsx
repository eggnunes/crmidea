import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  FileText,
  Calculator,
  MessageSquare,
  BarChart3,
  Scale,
  Gavel,
  UserCheck,
  Shield,
  Megaphone,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Award,
  Brain,
  Target,
  Zap,
  Building2,
  Menu
} from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { useState } from "react";
import logoConsultoria from "@/assets/logo-consultoria.png";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = [
  {
    id: "documentos",
    name: "Automação de Documentos",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
    monthlyTime: "34,5-50,5h",
    monthlyValue: "R$ 5.175 - R$ 7.575",
    annualValue: "R$ 62.100 - R$ 90.900",
    features: [
      { name: "Geração Automática de Contratos", time: "9-14h/mês", value: "R$ 1.350 - R$ 2.100" },
      { name: "Revisão Automática de Documentos", time: "8-10h/mês", value: "R$ 1.200 - R$ 1.500" },
      { name: "Templates Inteligentes de Petições", time: "12,5-19h/mês", value: "R$ 1.875 - R$ 2.850" },
      { name: "Integração com Assinatura Digital", time: "5-7,5h/mês", value: "R$ 750 - R$ 1.125" }
    ]
  },
  {
    id: "financeiro",
    name: "Gestão Financeira",
    icon: DollarSign,
    color: "from-emerald-500 to-green-500",
    monthlyTime: "42-54,75h",
    monthlyValue: "R$ 19.550 - R$ 27.940",
    annualValue: "R$ 234.600 - R$ 335.280",
    features: [
      { name: "Dashboard Financeiro em Tempo Real", time: "8-12h/mês", value: "R$ 280 - R$ 420" },
      { name: "Boletos Automáticos", time: "6,5-9,5h/mês", value: "R$ 230 - R$ 330" },
      { name: "Análise de Rentabilidade", time: "-", value: "R$ 7.500 - R$ 12.500" },
      { name: "Cobranças Automáticas", time: "2,5-3,75h/mês", value: "R$ 90 - R$ 130" },
      { name: "Cálculo de Honorários de Êxito", time: "5-6,5h/mês", value: "R$ 750 - R$ 975" },
      { name: "Conciliação Bancária", time: "13-22h/mês", value: "R$ 455 - R$ 770" }
    ]
  },
  {
    id: "equipe",
    name: "Gestão de Equipe e RH",
    icon: Users,
    color: "from-purple-500 to-violet-500",
    monthlyTime: "27,5-38h",
    monthlyValue: "R$ 4.450 - R$ 8.330",
    annualValue: "R$ 53.400 - R$ 99.960",
    features: [
      { name: "Ponto Eletrônico Automatizado", time: "6-8h/mês", value: "R$ 210 - R$ 280" },
      { name: "Gestão de Férias", time: "3,5-5h/mês", value: "R$ 125 - R$ 175" },
      { name: "Folha de Pagamento", time: "10-13h/mês", value: "R$ 350 - R$ 455" },
      { name: "Acompanhamento de Produtividade", time: "-", value: "R$ 3.500 - R$ 7.000" },
      { name: "Gestão de Home Office", time: "5-8h/mês", value: "R$ 175 - R$ 280" }
    ]
  },
  {
    id: "crm",
    name: "CRM e Captação de Clientes",
    icon: Target,
    color: "from-orange-500 to-amber-500",
    monthlyTime: "14,25-21,5h",
    monthlyValue: "R$ 54.640 - R$ 156.725",
    annualValue: "R$ 655.680 - R$ 1.880.700",
    features: [
      { name: "CRM com Funil de Vendas", time: "8-12h/mês", value: "R$ 1.200 - R$ 1.800" },
      { name: "Propostas Automatizadas", time: "6,25-9,5h/mês", value: "R$ 940 - R$ 1.425" },
      { name: "Rastreamento de Leads", time: "-", value: "R$ 2.500 - R$ 3.500" },
      { name: "Cálculo de CAC e ROI", time: "-", value: "R$ 50.000 - R$ 150.000" }
    ]
  },
  {
    id: "comunicacao",
    name: "Comunicação com Clientes",
    icon: MessageSquare,
    color: "from-pink-500 to-rose-500",
    monthlyTime: "43-66h",
    monthlyValue: "R$ 1.890 - R$ 2.910",
    annualValue: "R$ 22.680 - R$ 34.920",
    features: [
      { name: "Portal do Cliente", time: "12-20h/mês", value: "R$ 600 - R$ 1.000" },
      { name: "Atualizações Automáticas", time: "13,5-20h/mês", value: "R$ 675 - R$ 1.000" },
      { name: "Agendamento de Reuniões", time: "6,5-10h/mês", value: "R$ 230 - R$ 350" },
      { name: "Chatbot Inteligente", time: "6-9h/mês", value: "R$ 210 - R$ 315" },
      { name: "Mensagens Automáticas", time: "5-7h/mês", value: "R$ 175 - R$ 245" }
    ]
  },
  {
    id: "jurimetria",
    name: "Jurimetria e Inteligência Jurídica",
    icon: BarChart3,
    color: "from-indigo-500 to-blue-500",
    monthlyTime: "16,5-36,5h",
    monthlyValue: "R$ 49.975 - R$ 89.475",
    annualValue: "R$ 599.700 - R$ 1.073.700",
    features: [
      { name: "Análises Estatísticas de Processos", time: "-", value: "R$ 25.000 - R$ 50.000" },
      { name: "Previsão de Êxito com IA", time: "-", value: "R$ 6.000 - R$ 9.000" },
      { name: "Identificação de Juízes Favoráveis", time: "-", value: "R$ 16.500 - R$ 33.000" },
      { name: "Banco de Decisões Favoráveis", time: "16,5-36,5h/mês", value: "R$ 2.475 - R$ 5.475" }
    ]
  },
  {
    id: "processual",
    name: "Gestão Processual e Prazos",
    icon: Scale,
    color: "from-teal-500 to-cyan-500",
    monthlyTime: "4,5-7h",
    monthlyValue: "R$ 20.675 - R$ 31.050",
    annualValue: "R$ 248.100 - R$ 372.600",
    features: [
      { name: "Distribuição Automática de Tarefas", time: "4,5-7h/mês", value: "R$ 675 - R$ 1.050" },
      { name: "Controle de Tempo por Tarefa", time: "-", value: "R$ 20.000 - R$ 30.000" },
      { name: "Alertas de Prazos", time: "-", value: "Evita perdas de R$ 50.000+" }
    ]
  },
  {
    id: "audiencias",
    name: "Audiências e Sustentações",
    icon: Gavel,
    color: "from-red-500 to-orange-500",
    monthlyTime: "55,5-87,5h",
    monthlyValue: "R$ 4.825 - R$ 7.625",
    annualValue: "R$ 57.900 - R$ 91.500",
    features: [
      { name: "Preparação Automática", time: "15-23,5h/mês", value: "R$ 2.250 - R$ 3.525" },
      { name: "Gravação e Transcrição", time: "35-55h/mês", value: "R$ 1.750 - R$ 2.750" },
      { name: "Acesso Rápido a Precedentes", time: "5,5-9h/mês", value: "R$ 825 - R$ 1.350" }
    ]
  }
];

const officeTypes = [
  {
    type: "pequeno",
    name: "Escritório Pequeno",
    lawyers: "1-3 advogados",
    icon: Building2,
    monthlyEconomy: "R$ 35.000 - R$ 60.000",
    annualEconomy: "R$ 420.000 - R$ 720.000",
    hours: "80-120 horas/mês",
    equivalent: "1-2 colaboradores",
    priorities: ["Automação de documentos", "Portal do cliente", "Gestão financeira básica", "CRM simplificado"]
  },
  {
    type: "medio",
    name: "Escritório Médio",
    lawyers: "4-10 advogados",
    icon: Building2,
    monthlyEconomy: "R$ 80.000 - R$ 150.000",
    annualEconomy: "R$ 960.000 - R$ 1.800.000",
    hours: "150-250 horas/mês",
    equivalent: "2-4 colaboradores",
    priorities: ["Todas as anteriores", "Gestão de equipe completa", "Jurimetria", "Gestão processual avançada", "Marketing digital"]
  },
  {
    type: "grande",
    name: "Escritório Grande",
    lawyers: "10+ advogados",
    icon: Building2,
    monthlyEconomy: "R$ 164.860 - R$ 337.530",
    annualEconomy: "R$ 1.978.320 - R$ 4.050.360",
    hours: "270-415 horas/mês",
    equivalent: "4-6 colaboradores",
    priorities: ["Implementação completa de todas as categorias"]
  }
];

const intangibleBenefits = [
  { icon: Brain, title: "Redução de Estresse", description: "Menos tarefas manuais, menos preocupação com prazos, menos erros" },
  { icon: Clock, title: "Qualidade de Vida", description: "Menos horas trabalhadas, mais tempo para família e lazer" },
  { icon: Users, title: "Satisfação do Cliente", description: "Atendimento mais rápido, mais transparência, menos erros" },
  { icon: UserCheck, title: "Satisfação da Equipe", description: "Menos trabalho operacional, mais trabalho estratégico" },
  { icon: Target, title: "Competitividade", description: "Escritório mais moderno, processos mais eficientes" },
  { icon: TrendingUp, title: "Escalabilidade", description: "Atenda mais clientes sem contratar, crescimento sustentável" }
];

export function ConsultingEconomyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);




  return (
    <>
      <SEOHead
        title="Economia com IA na Advocacia: Reduza Custos no Escritório | Rafael Egg"
        description="Descubra como a inteligência artificial pode reduzir custos e aumentar a lucratividade do seu escritório de advocacia. Resultados comprovados."
        canonical="https://rafaelegg.com/consultoria/economia"
      />
      
      <div className="min-h-screen bg-[hsl(222,47%,5%)] overflow-x-hidden">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[hsl(222,47%,5%)]/80 border-b border-white/5">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/consultoria">
                <img 
                  src={logoConsultoria} 
                  alt="Consultoria IDEA" 
                  className="h-16 md:h-20 w-auto object-contain"
                />
              </Link>
              
              <div className="hidden md:flex items-center gap-6">
                <Link to="/consultoria" className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Link>
                <a href="#categorias" className="text-sm text-white/70 hover:text-white transition-colors">Categorias</a>
                <a href="#por-porte" className="text-sm text-white/70 hover:text-white transition-colors">Por Porte</a>
                <a href="#roi" className="text-sm text-white/70 hover:text-white transition-colors">ROI</a>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0" asChild>
                  <a href="https://pay.kiwify.com.br/O6KhBrS" target="_blank" rel="noopener noreferrer">
                    Contratar Consultoria
                  </a>
                </Button>
              </div>

              {/* Mobile Menu */}
              <div className="flex md:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72 bg-[hsl(222,47%,8%)] border-white/10">
                    <div className="flex flex-col gap-4 mt-8">
                      <Link to="/consultoria" className="text-white/70 hover:text-white transition-colors py-2 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Consultoria
                      </Link>
                      <a href="#categorias" className="text-white/70 hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Categorias</a>
                      <a href="#por-porte" className="text-white/70 hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Por Porte</a>
                      <a href="#roi" className="text-white/70 hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>ROI</a>
                      <div className="border-t border-white/10 pt-4 mt-4">
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600" asChild onClick={() => setMobileMenuOpen(false)}>
                          <a href="https://pay.kiwify.com.br/O6KhBrS" target="_blank" rel="noopener noreferrer">
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
        <section className="relative pt-32 pb-20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-green-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[150px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400">
                <Calculator className="w-3 h-3 mr-1" />
                Análise de Economia Completa
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="text-white">Quanto você está</span>
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400 bg-clip-text text-transparent">
                  deixando de economizar?
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-2xl mx-auto">
                Descubra a economia real que um sistema de IA pode gerar para seu escritório de advocacia
              </p>

              {/* Main Stats */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <Card className="bg-white/[0.03] border-white/10 hover:border-emerald-500/30 transition-all">
                  <CardContent className="pt-6 text-center">
                    <Clock className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">270-415h</div>
                    <div className="text-white/60">Horas economizadas/mês</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/10 hover:border-emerald-500/30 transition-all">
                  <CardContent className="pt-6 text-center">
                    <DollarSign className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">Até R$ 337K</div>
                    <div className="text-white/60">Economia mensal</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/10 hover:border-emerald-500/30 transition-all">
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">Até R$ 4M</div>
                    <div className="text-white/60">Economia anual</div>
                  </CardContent>
                </Card>
              </div>

              <p className="text-sm text-white/50 mb-8">
                * Baseado em dados de mercado, pesquisas sobre produtividade jurídica e experiência prática de 50+ escritórios atendidos
              </p>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-white/30" />
          </div>
        </section>

        {/* Categories Section */}
        <section id="categorias" className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222,47%,5%)] via-[hsl(222,47%,8%)] to-[hsl(222,47%,5%)]" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/80">
                <BarChart3 className="w-3 h-3 mr-1" />
                Economia por Categoria
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Economia detalhada por <span className="text-emerald-400">área</span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Veja quanto cada funcionalidade pode economizar mensalmente no seu escritório
              </p>
            </div>

            <div className="grid gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="bg-white/[0.02] border-white/5 hover:border-emerald-500/30 transition-all overflow-hidden">
                  <CardHeader className="pb-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                          <category.icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-white">{category.name}</CardTitle>
                          <p className="text-white/50 text-sm">Economia anual: {category.annualValue}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Badge className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300">
                          <Clock className="w-3 h-3 mr-1" />
                          {category.monthlyTime}/mês
                        </Badge>
                        <Badge className="bg-green-500/20 border-green-500/30 text-green-300">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {category.monthlyValue}/mês
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {category.features.map((feature, idx) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-lg p-3 hover:border-emerald-500/20 transition-all">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium text-white text-sm">{feature.name}</div>
                              <div className="text-xs text-white/50 mt-1">
                                {feature.time !== "-" && <span className="mr-2">{feature.time}</span>}
                                <span className="text-emerald-400">{feature.value}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* By Office Size Section */}
        <section id="por-porte" className="py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[150px]" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/80">
                <Building2 className="w-3 h-3 mr-1" />
                Análise por Porte
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Economia por <span className="text-emerald-400">tamanho de escritório</span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Veja quanto você pode economizar de acordo com o porte do seu escritório
              </p>
            </div>

            <Tabs defaultValue="pequeno" className="w-full">
              <TabsList className="grid w-full max-w-xl mx-auto grid-cols-3 bg-white/5 mb-8">
                <TabsTrigger value="pequeno" className="data-[state=active]:bg-emerald-500/20">Pequeno</TabsTrigger>
                <TabsTrigger value="medio" className="data-[state=active]:bg-emerald-500/20">Médio</TabsTrigger>
                <TabsTrigger value="grande" className="data-[state=active]:bg-emerald-500/20">Grande</TabsTrigger>
              </TabsList>
              
              {officeTypes.map((office) => (
                <TabsContent key={office.type} value={office.type}>
                  <Card className="bg-white/[0.03] border-white/10 max-w-4xl mx-auto">
                    <CardHeader className="text-center pb-0">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mx-auto mb-4">
                        <office.icon className="w-10 h-10 text-emerald-400" />
                      </div>
                      <CardTitle className="text-2xl text-white">{office.name}</CardTitle>
                      <p className="text-white/50">{office.lawyers}</p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 text-center">
                          <DollarSign className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <div className="text-sm text-white/50 mb-1">Economia Mensal</div>
                          <div className="text-2xl font-bold text-emerald-400">{office.monthlyEconomy}</div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 text-center">
                          <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <div className="text-sm text-white/50 mb-1">Economia Anual</div>
                          <div className="text-2xl font-bold text-green-400">{office.annualEconomy}</div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-lg p-4">
                          <Clock className="w-6 h-6 text-blue-400" />
                          <div>
                            <div className="text-sm text-white/50">Tempo economizado</div>
                            <div className="font-semibold text-white">{office.hours}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-lg p-4">
                          <Users className="w-6 h-6 text-purple-400" />
                          <div>
                            <div className="text-sm text-white/50">Equivalente a contratar</div>
                            <div className="font-semibold text-white">{office.equivalent}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                        <div className="text-sm text-white/50 mb-3">Funcionalidades prioritárias:</div>
                        <div className="flex flex-wrap gap-2">
                          {office.priorities.map((priority, idx) => (
                            <Badge key={idx} variant="outline" className="border-emerald-500/30 text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {priority}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* ROI Section */}
        <section id="roi" className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222,47%,5%)] via-[hsl(222,47%,8%)] to-[hsl(222,47%,5%)]" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400">
                <Award className="w-3 h-3 mr-1" />
                Retorno sobre Investimento
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                O investimento que <span className="text-yellow-400">se paga em dias</span>
              </h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="text-sm text-white/50 mb-2">Investimento na Consultoria IDEA</div>
                    <div className="text-4xl font-bold text-white">R$ 50.000</div>
                    <div className="text-white/50">(pagamento único)</div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <Card className="bg-white/[0.02] border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-white/80">Cenário Conservador</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-white/50">Economia mensal</div>
                            <div className="text-xl font-bold text-white">R$ 80.000</div>
                          </div>
                          <div>
                            <div className="text-sm text-white/50">Payback</div>
                            <div className="text-xl font-bold text-emerald-400">19 dias</div>
                          </div>
                          <div>
                            <div className="text-sm text-white/50">ROI em 12 meses</div>
                            <div className="text-xl font-bold text-yellow-400">1.820%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white/[0.02] border-emerald-500/30 ring-2 ring-emerald-500/20">
                      <CardHeader className="pb-2">
                        <Badge className="w-fit mx-auto bg-emerald-500/20 text-emerald-300">Realista</Badge>
                        <CardTitle className="text-lg text-white">Cenário Realista</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-white/50">Economia mensal</div>
                            <div className="text-xl font-bold text-white">R$ 115.000</div>
                          </div>
                          <div>
                            <div className="text-sm text-white/50">Payback</div>
                            <div className="text-xl font-bold text-emerald-400">13 dias</div>
                          </div>
                          <div>
                            <div className="text-sm text-white/50">ROI em 12 meses</div>
                            <div className="text-xl font-bold text-yellow-400">2.660%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white/[0.02] border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-white/80">Cenário Otimista</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-white/50">Economia mensal</div>
                            <div className="text-xl font-bold text-white">R$ 150.000</div>
                          </div>
                          <div>
                            <div className="text-sm text-white/50">Payback</div>
                            <div className="text-xl font-bold text-emerald-400">10 dias</div>
                          </div>
                          <div>
                            <div className="text-sm text-white/50">ROI em 12 meses</div>
                            <div className="text-xl font-bold text-yellow-400">3.500%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Intangible Benefits */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[180px]" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/80">
                <Sparkles className="w-3 h-3 mr-1" />
                Benefícios Intangíveis
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Além da economia <span className="text-blue-400">quantificável</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {intangibleBenefits.map((benefit, idx) => (
                <Card key={idx} className="bg-white/[0.02] border-white/5 hover:border-blue-500/30 transition-all">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-white">{benefit.title}</h3>
                    <p className="text-white/60 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final Summary */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222,47%,5%)] via-[hsl(222,47%,8%)] to-[hsl(222,47%,5%)]" />
          
          <div className="container mx-auto px-4 relative z-10">
            <Card className="max-w-4xl mx-auto bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                    Resumo: O que você <span className="text-emerald-400">ganha</span>
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Economia de 270-415 horas/mês</div>
                      <div className="text-white/60 text-sm">Tempo que você pode usar para crescer</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Até R$ 337.530/mês em economia</div>
                      <div className="text-white/60 text-sm">Entre ganhos diretos e indiretos</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">ROI de 1.820-3.500% em 12 meses</div>
                      <div className="text-white/60 text-sm">Investimento que se multiplica</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Payback em 10-19 dias</div>
                      <div className="text-white/60 text-sm">Retorno praticamente imediato</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Equivalente a 4-6 colaboradores</div>
                      <div className="text-white/60 text-sm">Sem os custos trabalhistas</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Até R$ 4 milhões/ano</div>
                      <div className="text-white/60 text-sm">Economia máxima potencial</div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xl text-white mb-6">
                    <strong className="text-emerald-400">Cada dia sem automação</strong> é dinheiro desperdiçado e oportunidades perdidas.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-0 text-lg px-8 py-6" asChild>
                      <a href="https://pay.kiwify.com.br/O6KhBrS" target="_blank" rel="noopener noreferrer">
                        QUERO ECONOMIZAR AGORA
                        <ArrowRight className="w-5 h-5" />
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6" asChild>
                      <Link to="/consultoria">
                        <ArrowLeft className="w-5 h-5" />
                        Voltar para Consultoria
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <img src={logoConsultoria} alt="Consultoria IDEA" className="h-12 w-auto" />
              <p className="text-white/40 text-sm text-center md:text-right">
                Consultoria IDEA - IA para Advogados © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
