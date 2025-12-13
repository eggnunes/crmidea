import { PRODUCTS, STATUSES, Lead } from "@/types/crm";
import { useLeads } from "@/hooks/useLeads";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DashboardCharts } from "@/components/DashboardCharts";

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = "primary"
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  color?: string;
}) {
  return (
    <Card className="glass border-border/50 hover:border-primary/30 transition-colors animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                {trend.positive ? (
                  <ArrowUpRight className="w-4 h-4 text-success" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-destructive" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  trend.positive ? "text-success" : "text-destructive"
                )}>
                  {trend.value}%
                </span>
                <span className="text-sm text-muted-foreground">vs mês anterior</span>
              </div>
            )}
          </div>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            color === "primary" && "bg-primary/10 text-primary",
            color === "success" && "bg-success/10 text-success",
            color === "warning" && "bg-warning/10 text-warning",
            color === "accent" && "bg-accent/10 text-accent"
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductCard({ product, leadsCount, revenue }: { 
  product: typeof PRODUCTS[0]; 
  leadsCount: number;
  revenue: number;
}) {
  const colorClasses: Record<string, string> = {
    consultoria: "border-l-consultoria bg-consultoria/5",
    mentoria: "border-l-mentoria bg-mentoria/5",
    curso: "border-l-curso bg-curso/5",
    ebook: "border-l-ebook bg-ebook/5"
  };

  return (
    <div className={cn(
      "p-4 rounded-lg border border-border/50 border-l-4 hover:border-border transition-colors",
      colorClasses[product.color]
    )}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-foreground">{product.shortName}</h4>
        <Badge variant="secondary" className="text-xs">
          {product.price}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{leadsCount} leads</span>
        <span className="text-foreground font-medium">
          R$ {revenue.toLocaleString('pt-BR')}
        </span>
      </div>
    </div>
  );
}

function RecentLeadRow({ lead }: { lead: Lead }) {
  const product = PRODUCTS.find(p => p.id === lead.product);
  const status = STATUSES.find(s => s.id === lead.status);

  const statusColors: Record<string, string> = {
    info: "bg-info/10 text-info border-info/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    mentoria: "bg-mentoria/10 text-mentoria border-mentoria/20",
    success: "bg-success/10 text-success border-success/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20"
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground">
            {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
        <div>
          <p className="font-medium text-foreground">{lead.name}</p>
          <p className="text-sm text-muted-foreground">{product?.shortName}</p>
        </div>
      </div>
      <Badge 
        variant="outline" 
        className={cn("text-xs", statusColors[status?.color || 'primary'])}
      >
        {status?.name}
      </Badge>
    </div>
  );
}

export function DashboardPage() {
  const { leads, loading } = useLeads();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => !['fechado-ganho', 'fechado-perdido'].includes(l.status)).length;
  const wonDeals = leads.filter(l => l.status === 'fechado-ganho');
  const totalRevenue = wonDeals.reduce((acc, l) => acc + l.value, 0);
  const pipelineValue = leads
    .filter(l => !['fechado-ganho', 'fechado-perdido'].includes(l.status))
    .reduce((acc, l) => acc + l.value, 0);

  const productStats = PRODUCTS.map(product => ({
    product,
    leadsCount: leads.filter(l => l.product === product.id).length,
    revenue: leads
      .filter(l => l.product === product.id && l.status === 'fechado-ganho')
      .reduce((acc, l) => acc + l.value, 0)
  }));

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu funil de vendas</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Leads"
          value={totalLeads}
          subtitle={`${activeLeads} ativos`}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Em Negociação"
          value={leads.filter(l => l.status === 'negociacao').length}
          subtitle="aguardando fechamento"
          icon={Target}
          color="warning"
        />
        <StatCard
          title="Valor no Pipeline"
          value={`R$ ${pipelineValue.toLocaleString('pt-BR')}`}
          subtitle="potencial de vendas"
          icon={TrendingUp}
          color="accent"
        />
        <StatCard
          title="Receita Gerada"
          value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`}
          subtitle={`${wonDeals.length} vendas fechadas`}
          icon={DollarSign}
          color="success"
        />
      </div>

      {/* Charts Section */}
      <DashboardCharts leads={leads} />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Performance */}
        <Card className="lg:col-span-2 glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Desempenho por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productStats
                .filter(ps => ps.leadsCount > 0 || ps.revenue > 0)
                .map(({ product, leadsCount, revenue }) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    leadsCount={leadsCount}
                    revenue={revenue}
                  />
                ))}
              {productStats.every(ps => ps.leadsCount === 0) && (
                <p className="text-muted-foreground col-span-2 text-center py-8">
                  Nenhum lead cadastrado ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length > 0 ? (
              <div>
                {recentLeads.map(lead => (
                  <RecentLeadRow key={lead.id} lead={lead} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum lead cadastrado ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
