import { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Mail,
  Send,
  Eye,
  MousePointer,
  XCircle,
  TrendingUp,
  Users,
  BarChart3,
  Target,
  UserMinus,
} from "lucide-react";
import { CampaignWithStats } from "@/hooks/useCampaigns";
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
  Legend,
  LineChart,
  Line,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface EmailUnsubscribe {
  id: string;
  email: string;
  unsubscribed_at: string;
  reason: string | null;
  campaign_id: string | null;
}

interface EmailCampaignDashboardProps {
  campaigns: CampaignWithStats[];
}

export function EmailCampaignDashboard({ campaigns }: EmailCampaignDashboardProps) {
  const [unsubscribes, setUnsubscribes] = useState<EmailUnsubscribe[]>([]);
  const [loadingUnsubscribes, setLoadingUnsubscribes] = useState(true);

  useEffect(() => {
    const fetchUnsubscribes = async () => {
      try {
        const { data, error } = await supabase
          .from("email_unsubscribes")
          .select("*")
          .order("unsubscribed_at", { ascending: false });
        
        if (error) throw error;
        setUnsubscribes(data || []);
      } catch (err) {
        console.error("Error fetching unsubscribes:", err);
      } finally {
        setLoadingUnsubscribes(false);
      }
    };
    fetchUnsubscribes();
  }, []);

  const stats = useMemo(() => {
    const totalRecipients = campaigns.reduce((acc, c) => acc + c.total_recipients, 0);
    const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
    const totalFailed = campaigns.reduce((acc, c) => acc + c.failed_count, 0);
    const totalOpened = campaigns.reduce((acc, c) => acc + c.opened_count, 0);
    const totalUnsubscribed = unsubscribes.length;
    
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const deliveryRate = totalRecipients > 0 ? (totalSent / totalRecipients) * 100 : 0;
    const failureRate = totalRecipients > 0 ? (totalFailed / totalRecipients) * 100 : 0;
    const unsubscribeRate = totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0;
    
    return {
      totalCampaigns: campaigns.length,
      totalRecipients,
      totalSent,
      totalFailed,
      totalOpened,
      totalUnsubscribed,
      openRate,
      deliveryRate,
      failureRate,
      unsubscribeRate,
    };
  }, [campaigns, unsubscribes]);

  const unsubscribesByDay = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, "yyyy-MM-dd");
    });

    const countByDay = unsubscribes.reduce((acc, u) => {
      const day = format(parseISO(u.unsubscribed_at), "yyyy-MM-dd");
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return last30Days.map(date => ({
      date: format(parseISO(date), "dd/MM", { locale: ptBR }),
      descadastros: countByDay[date] || 0,
    }));
  }, [unsubscribes]);

  const statusData = useMemo(() => {
    const statusCounts = campaigns.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: getStatusLabel(status),
      value: count,
      color: getStatusColor(status),
    }));
  }, [campaigns]);

  const performanceData = useMemo(() => {
    return campaigns
      .filter(c => c.total_recipients > 0)
      .map(c => ({
        name: c.name.length > 20 ? c.name.substring(0, 20) + "..." : c.name,
        enviados: c.sent_count,
        abertos: c.opened_count,
        falhas: c.failed_count,
      }))
      .slice(0, 10);
  }, [campaigns]);

  const deliveryData = useMemo(() => {
    return [
      { name: "Enviados", value: stats.totalSent, color: "hsl(var(--success))" },
      { name: "Abertos", value: stats.totalOpened, color: "hsl(var(--info))" },
      { name: "Falhas", value: stats.totalFailed, color: "hsl(var(--destructive))" },
      { name: "Pendentes", value: stats.totalRecipients - stats.totalSent - stats.totalFailed, color: "hsl(var(--muted))" },
    ].filter(d => d.value > 0);
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Key Metrics - 5 cards now */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                <p className="text-xs text-muted-foreground">Campanhas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-info/10">
                <Users className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRecipients.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Destinatários</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <Send className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Eye className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalOpened.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Abertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <UserMinus className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUnsubscribed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Descadastros</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Taxa de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold">{stats.deliveryRate.toFixed(1)}%</span>
                <Badge variant="outline" className="text-success border-success">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Bom
                </Badge>
              </div>
              <Progress value={stats.deliveryRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats.totalSent} de {stats.totalRecipients} emails entregues
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Taxa de Abertura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold">{stats.openRate.toFixed(1)}%</span>
                <Badge variant="outline" className={stats.openRate >= 20 ? "text-success border-success" : "text-warning border-warning"}>
                  {stats.openRate >= 20 ? "Ótimo" : "Regular"}
                </Badge>
              </div>
              <Progress value={stats.openRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats.totalOpened} emails abertos
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Taxa de Falha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold">{stats.failureRate.toFixed(1)}%</span>
                <Badge variant="outline" className={stats.failureRate <= 5 ? "text-success border-success" : "text-destructive border-destructive"}>
                  {stats.failureRate <= 5 ? "Baixo" : "Alto"}
                </Badge>
              </div>
              <Progress value={stats.failureRate} className="h-2 [&>div]:bg-destructive" />
              <p className="text-xs text-muted-foreground">
                {stats.totalFailed} emails falharam
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserMinus className="w-4 h-4" />
              Taxa de Descadastro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold">{stats.unsubscribeRate.toFixed(2)}%</span>
                <Badge variant="outline" className={stats.unsubscribeRate <= 0.5 ? "text-success border-success" : "text-warning border-warning"}>
                  {stats.unsubscribeRate <= 0.5 ? "Normal" : "Atenção"}
                </Badge>
              </div>
              <Progress value={Math.min(stats.unsubscribeRate * 10, 100)} className="h-2 [&>div]:bg-warning" />
              <p className="text-xs text-muted-foreground">
                {stats.totalUnsubscribed} descadastros
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Campaign */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance por Campanha
            </CardTitle>
            <CardDescription>
              Comparativo de envios, aberturas e falhas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="enviados" name="Enviados" fill="hsl(var(--success))" />
                  <Bar dataKey="abertos" name="Abertos" fill="hsl(var(--info))" />
                  <Bar dataKey="falhas" name="Falhas" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma campanha com dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Distribuição de Entregas
            </CardTitle>
            <CardDescription>
              Visão geral do status dos emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deliveryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deliveryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {deliveryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado de entrega disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      {statusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status das Campanhas</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {statusData.map((item) => (
                <div 
                  key={item.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                  style={{ borderColor: item.color }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="secondary">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unsubscribes Chart and Recent List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unsubscribes over time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="w-5 h-5" />
              Descadastros nos Últimos 30 Dias
            </CardTitle>
            <CardDescription>
              Evolução diária de descadastros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={unsubscribesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  interval="preserveStartEnd"
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="descadastros" 
                  name="Descadastros"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--destructive))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Unsubscribes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="w-5 h-5" />
              Descadastros Recentes
            </CardTitle>
            <CardDescription>
              Últimos e-mails descadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUnsubscribes ? (
              <div className="text-center py-4 text-muted-foreground">
                Carregando...
              </div>
            ) : unsubscribes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserMinus className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>Nenhum descadastro registrado</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {unsubscribes.slice(0, 10).map((unsub) => (
                  <div 
                    key={unsub.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{unsub.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(unsub.unsubscribed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-destructive border-destructive ml-2">
                      Descadastrado
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    rascunho: "Rascunho",
    agendada: "Agendada",
    em_andamento: "Em Andamento",
    pausada: "Pausada",
    concluida: "Concluída",
    cancelada: "Cancelada",
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    rascunho: "hsl(var(--muted-foreground))",
    agendada: "hsl(var(--info))",
    em_andamento: "hsl(var(--warning))",
    pausada: "hsl(var(--muted-foreground))",
    concluida: "hsl(var(--success))",
    cancelada: "hsl(var(--destructive))",
  };
  return colors[status] || "hsl(var(--muted-foreground))";
}
