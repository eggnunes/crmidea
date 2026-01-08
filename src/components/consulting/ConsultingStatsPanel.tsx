import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Loader2,
  Calendar,
} from "lucide-react";
import { format, differenceInDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
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
} from "recharts";

interface StatsData {
  totalClients: number;
  pendingClients: number;
  inProgressClients: number;
  completedClients: number;
  avgDaysToComplete: number;
  clientsByMonth: { month: string; count: number }[];
  clientsByState: { state: string; count: number }[];
  clientsByStatus: { name: string; value: number; color: string }[];
  recentClients: {
    id: string;
    full_name: string;
    office_name: string;
    status: string;
    created_at: string;
  }[];
}

const STATUS_COLORS = {
  pending: "#facc15",
  in_progress: "#3b82f6",
  completed: "#22c55e",
};

export function ConsultingStatsPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    }
  }, [user?.id]);

  const fetchStats = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data: clients, error } = await supabase
        .from("consulting_clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!clients || clients.length === 0) {
        setStats({
          totalClients: 0,
          pendingClients: 0,
          inProgressClients: 0,
          completedClients: 0,
          avgDaysToComplete: 0,
          clientsByMonth: [],
          clientsByState: [],
          clientsByStatus: [],
          recentClients: [],
        });
        setLoading(false);
        return;
      }

      // Calculate stats
      const totalClients = clients.length;
      const pendingClients = clients.filter(c => c.status === "pending").length;
      const inProgressClients = clients.filter(c => c.status === "in_progress").length;
      const completedClients = clients.filter(c => c.status === "completed").length;

      // Calculate average days to complete (for completed clients)
      const completedClientsData = clients.filter(c => c.status === "completed");
      const avgDaysToComplete = completedClientsData.length > 0
        ? Math.round(
            completedClientsData.reduce((acc, c) => {
              return acc + differenceInDays(new Date(c.updated_at), new Date(c.created_at));
            }, 0) / completedClientsData.length
          )
        : 0;

      // Group by month (last 6 months)
      const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
      const clientsByMonth = last6Months.map(date => {
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const count = clients.filter(c => {
          const createdAt = new Date(c.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length;
        return {
          month: format(date, "MMM", { locale: ptBR }),
          count,
        };
      }).reverse();

      // Group by state
      const stateMap = new Map<string, number>();
      clients.forEach(c => {
        if (c.estado) {
          stateMap.set(c.estado, (stateMap.get(c.estado) || 0) + 1);
        }
      });
      const clientsByState = Array.from(stateMap.entries())
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Status distribution
      const clientsByStatus = [
        { name: "Pendentes", value: pendingClients, color: STATUS_COLORS.pending },
        { name: "Em Andamento", value: inProgressClients, color: STATUS_COLORS.in_progress },
        { name: "Concluídos", value: completedClients, color: STATUS_COLORS.completed },
      ];

      // Recent clients
      const recentClients = clients.slice(0, 5).map(c => ({
        id: c.id,
        full_name: c.full_name,
        office_name: c.office_name,
        status: c.status || "pending",
        created_at: c.created_at,
      }));

      setStats({
        totalClients,
        pendingClients,
        inProgressClients,
        completedClients,
        avgDaysToComplete,
        clientsByMonth,
        clientsByState,
        clientsByStatus,
        recentClients,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || stats.totalClients === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Sem dados para exibir</h3>
          <p className="text-muted-foreground text-center">
            Adicione clientes de consultoria para ver as estatísticas
          </p>
        </CardContent>
      </Card>
    );
  }

  const completionRate = stats.totalClients > 0 
    ? Math.round((stats.completedClients / stats.totalClients) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            <Progress value={completionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Média de Dias</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDaysToComplete}</div>
            <p className="text-xs text-muted-foreground">dias para concluir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingClients}</div>
            <p className="text-xs text-muted-foreground">aguardando início</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Clients by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Novos Clientes por Mês
            </CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.clientsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.clientsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {stats.clientsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Clients by State */}
        {stats.clientsByState.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Clientes por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.clientsByState.map((item) => (
                  <div key={item.state} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.state}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(item.count / stats.totalClients) * 100} 
                        className="w-24 h-2" 
                      />
                      <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Clientes Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{client.full_name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      {client.office_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={
                        client.status === "completed" ? "bg-green-100 text-green-700" :
                        client.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {client.status === "completed" ? "Concluído" :
                       client.status === "in_progress" ? "Em Andamento" : "Pendente"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
