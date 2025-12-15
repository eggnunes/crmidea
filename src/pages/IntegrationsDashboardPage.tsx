import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeLeads } from "@/hooks/useRealtimeLeads";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { format, subDays, subMonths, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

type PeriodFilter = '7d' | '30d' | '3m';

interface IntegrationMetrics {
  totalKiwifyLeads: number;
  totalInstagramLeads: number;
  pixGenerated: number;
  purchasesCompleted: number;
  abandonedCarts: number;
  refunds: number;
  conversionRate: number;
  dailyLeads: Array<{ date: string; kiwify: number; instagram: number }>;
  leadsByProduct: Array<{ name: string; value: number }>;
  leadsByStatus: Array<{ name: string; value: number }>;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  em_contato: 'Em Contato',
  qualificado: 'Qualificado',
  proposta_enviada: 'Proposta Enviada',
  negociacao: 'Negociação',
  fechado_ganho: 'Fechado Ganho',
  fechado_perdido: 'Fechado Perdido',
};

const productLabels: Record<string, string> = {
  consultoria: 'Consultoria',
  mentoria_coletiva: 'Mentoria Coletiva',
  mentoria_individual: 'Mentoria Individual',
  curso_idea: 'Curso IDEA',
  guia_ia: 'Guia IA',
  codigo_prompts: 'Código Prompts',
  combo_ebooks: 'Combo Ebooks',
};

export function IntegrationsDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('7d');
  const [metrics, setMetrics] = useState<IntegrationMetrics>({
    totalKiwifyLeads: 0,
    totalInstagramLeads: 0,
    pixGenerated: 0,
    purchasesCompleted: 0,
    abandonedCarts: 0,
    refunds: 0,
    conversionRate: 0,
    dailyLeads: [],
    leadsByProduct: [],
    leadsByStatus: [],
  });

  // Enable realtime notifications
  useRealtimeLeads(() => {
    // Refresh metrics when new lead arrives
    fetchMetrics(periodFilter);
  });

  const getDateRange = (period: PeriodFilter) => {
    const now = new Date();
    switch (period) {
      case '7d':
        return { start: subDays(now, 6), end: now, days: 7 };
      case '30d':
        return { start: subDays(now, 29), end: now, days: 30 };
      case '3m':
        return { start: subMonths(now, 3), end: now, days: 90 };
    }
  };

  const fetchMetrics = async (period: PeriodFilter) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { start, end, days } = getDateRange(period);

      // Fetch leads within period
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      // Calculate metrics
      const kiwifyLeads = leads?.filter(l => l.source === 'Kiwify') || [];
      const instagramLeads = leads?.filter(l => l.source?.includes('Instagram') || l.source === 'ManyChat') || [];

      // Fetch interactions for event-based metrics within period
      const { data: interactions } = await supabase
        .from('interactions')
        .select('*')
        .in('lead_id', leads?.map(l => l.id) || [])
        .gte('date', start.toISOString())
        .lte('date', end.toISOString());

      // Count events from interactions
      const pixEvents = interactions?.filter(i => i.description?.includes('pix_gerado')) || [];
      const purchaseEvents = interactions?.filter(i => i.description?.includes('compra_aprovada')) || [];
      const abandonedEvents = interactions?.filter(i => i.description?.includes('carrinho_abandonado')) || [];
      const refundEvents = interactions?.filter(i => 
        i.description?.includes('compra_reembolsada') || i.description?.includes('chargeback')
      ) || [];

      // Generate time intervals based on period
      let timeIntervals: Array<{ date: string; fullDate: Date; kiwify: number; instagram: number }>;
      
      if (days <= 7) {
        // Daily intervals for 7 days
        timeIntervals = eachDayOfInterval({ start, end }).map(date => ({
          date: format(date, 'dd/MM', { locale: ptBR }),
          fullDate: date,
          kiwify: 0,
          instagram: 0,
        }));
      } else if (days <= 30) {
        // Daily intervals for 30 days
        timeIntervals = eachDayOfInterval({ start, end }).map(date => ({
          date: format(date, 'dd/MM', { locale: ptBR }),
          fullDate: date,
          kiwify: 0,
          instagram: 0,
        }));
      } else {
        // Weekly intervals for 3 months
        timeIntervals = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }).map(weekStart => ({
          date: format(weekStart, "dd/MM", { locale: ptBR }),
          fullDate: weekStart,
          kiwify: 0,
          instagram: 0,
        }));
      }

      leads?.forEach(lead => {
        const leadDate = new Date(lead.created_at);
        
        if (days > 30) {
          // Find the week this lead belongs to
          const weekIndex = timeIntervals.findIndex((interval, idx) => {
            const weekEnd = idx < timeIntervals.length - 1 
              ? startOfDay(timeIntervals[idx + 1].fullDate)
              : endOfDay(end);
            return leadDate >= startOfDay(interval.fullDate) && leadDate < weekEnd;
          });
          
          if (weekIndex !== -1) {
            if (lead.source === 'Kiwify') {
              timeIntervals[weekIndex].kiwify++;
            } else if (lead.source?.includes('Instagram') || lead.source === 'ManyChat') {
              timeIntervals[weekIndex].instagram++;
            }
          }
        } else {
          const dayIndex = timeIntervals.findIndex(d => 
            leadDate >= startOfDay(d.fullDate) && leadDate <= endOfDay(d.fullDate)
          );
          
          if (dayIndex !== -1) {
            if (lead.source === 'Kiwify') {
              timeIntervals[dayIndex].kiwify++;
            } else if (lead.source?.includes('Instagram') || lead.source === 'ManyChat') {
              timeIntervals[dayIndex].instagram++;
            }
          }
        }
      });

      // Calculate leads by product
      const productCounts: Record<string, number> = {};
      leads?.forEach(lead => {
        productCounts[lead.product] = (productCounts[lead.product] || 0) + 1;
      });

      const leadsByProduct = Object.entries(productCounts).map(([name, value]) => ({
        name: productLabels[name] || name,
        value,
      }));

      // Calculate leads by status
      const statusCounts: Record<string, number> = {};
      leads?.forEach(lead => {
        statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
      });

      const leadsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name: statusLabels[name] || name,
        value,
      }));

      // Calculate conversion rate (PIX → Purchase)
      const conversionRate = pixEvents.length > 0 
        ? (purchaseEvents.length / pixEvents.length) * 100 
        : 0;

      setMetrics({
        totalKiwifyLeads: kiwifyLeads.length,
        totalInstagramLeads: instagramLeads.length,
        pixGenerated: pixEvents.length,
        purchasesCompleted: purchaseEvents.length,
        abandonedCarts: abandonedEvents.length,
        refunds: refundEvents.length,
        conversionRate,
        dailyLeads: timeIntervals.map(d => ({ date: d.date, kiwify: d.kiwify, instagram: d.instagram })),
        leadsByProduct,
        leadsByStatus,
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(periodFilter);
  }, [user, periodFilter]);

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case '7d': return 'Últimos 7 Dias';
      case '30d': return 'Últimos 30 Dias';
      case '3m': return 'Últimos 3 Meses';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard de Integrações</h1>
            <p className="text-muted-foreground">Métricas em tempo real das suas integrações</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="3m">3 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchMetrics(periodFilter)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Kiwify</p>
                <p className="text-2xl font-bold">{metrics.totalKiwifyLeads}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Instagram</p>
                <p className="text-2xl font-bold">{metrics.totalInstagramLeads}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {metrics.conversionRate > 50 ? (
                  <ArrowUpRight className="w-5 h-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-orange-500" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">PIX → Compra</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Carrinhos Abandonados</p>
                <p className="text-2xl font-bold">{metrics.abandonedCarts}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-lg font-bold">{metrics.pixGenerated}</p>
                <p className="text-xs text-muted-foreground">PIX Gerados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-lg font-bold">{metrics.purchasesCompleted}</p>
                <p className="text-xs text-muted-foreground">Compras</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-lg font-bold">{metrics.abandonedCarts}</p>
                <p className="text-xs text-muted-foreground">Abandonos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <ArrowDownRight className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-lg font-bold">{metrics.refunds}</p>
                <p className="text-xs text-muted-foreground">Reembolsos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Leads por Dia</TabsTrigger>
          <TabsTrigger value="products">Por Produto</TabsTrigger>
          <TabsTrigger value="status">Por Status</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Leads - {getPeriodLabel()}
              </CardTitle>
              <CardDescription>Comparativo entre Kiwify e Instagram {periodFilter === '3m' ? '(por semana)' : '(por dia)'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.dailyLeads}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="kiwify" name="Kiwify" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="instagram" name="Instagram" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Leads por Produto</CardTitle>
              <CardDescription>Distribuição de interesse por produto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.leadsByProduct}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics.leadsByProduct.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Leads por Status</CardTitle>
              <CardDescription>Funil de conversão atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.leadsByStatus} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120} 
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                <span className="text-white font-bold">K</span>
              </div>
              <div>
                <p className="font-medium">Kiwify</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Webhook Ativo
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <div>
                <p className="font-medium">ManyChat</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-blue-500 border-blue-500">
                    Conectado
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-white font-bold">IG</span>
              </div>
              <div>
                <p className="font-medium">Instagram</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-pink-500 border-pink-500">
                    Via ManyChat
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
