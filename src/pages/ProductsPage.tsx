import { PRODUCTS } from "@/types/crm";
import { useLeads } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  ExternalLink, 
  Users, 
  DollarSign,
  TrendingUp,
  Crown,
  GraduationCap,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";

const productIcons: Record<string, React.ElementType> = {
  consultoria: Crown,
  mentoria: Users,
  curso: GraduationCap,
  ebook: BookOpen
};

const productUrls: Record<string, string> = {
  'consultoria': 'https://mentoriarafaelegg.com.br/consultoria-idea/',
  'mentoria-coletiva': 'https://mentoriarafaelegg.com.br/inscricoes-abertas/',
  'mentoria-individual': 'https://mentoriarafaelegg.com.br/inscricoes-abertas/',
  'curso-idea': 'https://mentoriarafaelegg.com.br/curso-idea/',
  'guia-ia': 'https://mentoriarafaelegg.com.br/guia-de-ia/',
  'codigo-prompts': 'https://mentoriarafaelegg.com.br/codigo-dos-prompts/',
  'combo-ebooks': 'https://mentoriarafaelegg.com.br/combo-de-ebooks/'
};

export function ProductsPage() {
  const { leads } = useLeads();

  const productStats = PRODUCTS.map(product => {
    const productLeads = leads.filter(l => l.product === product.id);
    const wonLeads = productLeads.filter(l => l.status === 'fechado-ganho');
    const totalRevenue = wonLeads.reduce((acc, l) => acc + l.value, 0);
    const pipelineValue = productLeads
      .filter(l => !l.status.startsWith('fechado'))
      .reduce((acc, l) => acc + l.value, 0);
    
    return {
      product,
      totalLeads: productLeads.length,
      activeLeads: productLeads.filter(l => !l.status.startsWith('fechado')).length,
      wonDeals: wonLeads.length,
      totalRevenue,
      pipelineValue,
      conversionRate: productLeads.length > 0 
        ? Math.round((wonLeads.length / productLeads.length) * 100) 
        : 0
    };
  });

  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    consultoria: { 
      bg: "bg-consultoria/10", 
      border: "border-consultoria/30",
      text: "text-consultoria" 
    },
    mentoria: { 
      bg: "bg-mentoria/10", 
      border: "border-mentoria/30",
      text: "text-mentoria" 
    },
    curso: { 
      bg: "bg-curso/10", 
      border: "border-curso/30",
      text: "text-curso" 
    },
    ebook: { 
      bg: "bg-ebook/10", 
      border: "border-ebook/30",
      text: "text-ebook" 
    }
  };

  // Group products by tier
  const highTicket = productStats.filter(p => p.product.id === 'consultoria');
  const midTicket = productStats.filter(p => 
    p.product.id.includes('mentoria') || p.product.id === 'curso-idea'
  );
  const lowTicket = productStats.filter(p => 
    p.product.id.includes('guia') || 
    p.product.id.includes('codigo') || 
    p.product.id.includes('combo')
  );

  const ProductCard = ({ stat }: { stat: typeof productStats[0] }) => {
    const colors = colorClasses[stat.product.color];
    const Icon = productIcons[stat.product.color] || BookOpen;
    const url = productUrls[stat.product.id];

    return (
      <Card className={cn(
        "glass border-border/50 hover:border-border transition-all group",
        "border-l-4",
        colors.border.replace('/30', '')
      )}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors.bg)}>
              <Icon className={cn("w-6 h-6", colors.text)} />
            </div>
            <Badge variant="outline" className={cn("text-xs", colors.text, colors.border)}>
              {stat.product.price}
            </Badge>
          </div>
          <CardTitle className="text-lg mt-3">{stat.product.name}</CardTitle>
          <CardDescription className="text-sm">
            {stat.product.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="text-xs">Leads</span>
              </div>
              <p className="text-xl font-bold">{stat.totalLeads}</p>
              <p className="text-xs text-muted-foreground">{stat.activeLeads} ativos</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Receita</span>
              </div>
              <p className="text-xl font-bold text-success">
                R$ {stat.totalRevenue.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground">{stat.wonDeals} vendas</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Pipeline</span>
              </div>
              <p className="text-xl font-bold text-accent">
                R$ {stat.pipelineValue.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-xs">Conversão</span>
              </div>
              <p className="text-xl font-bold">{stat.conversionRate}%</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full group-hover:bg-secondary transition-colors"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              Ver Landing Page
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
        <p className="text-muted-foreground mt-1">Desempenho e métricas de cada produto</p>
      </div>

      {/* High Ticket */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-consultoria" />
          <h2 className="text-xl font-semibold">Alto Ticket</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {highTicket.map(stat => (
            <ProductCard key={stat.product.id} stat={stat} />
          ))}
        </div>
      </div>

      {/* Mid Ticket */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-mentoria" />
          <h2 className="text-xl font-semibold">Médio Ticket</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {midTicket.map(stat => (
            <ProductCard key={stat.product.id} stat={stat} />
          ))}
        </div>
      </div>

      {/* Low Ticket */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-ebook" />
          <h2 className="text-xl font-semibold">Entrada / E-books</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {lowTicket.map(stat => (
            <ProductCard key={stat.product.id} stat={stat} />
          ))}
        </div>
      </div>
    </div>
  );
}
