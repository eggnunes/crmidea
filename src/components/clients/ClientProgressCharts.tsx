import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp } from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  clientId: string;
}

interface FeedbackData {
  id: string;
  implementation_status: string;
  ai_usage_frequency: string | null;
  created_at: string;
}

interface SessionData {
  id: string;
  session_date: string;
  status: string | null;
}

const statusLabels: Record<string, string> = {
  not_started: "Não iniciado",
  in_progress: "Em andamento",
  completed: "Concluído",
  blocked: "Travado",
};

const frequencyLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  rarely: "Raramente",
  not_using: "Não usa",
};

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function ClientProgressCharts({ clientId }: Props) {
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      // Fetch feedback history
      const { data: feedback, error: feedbackError } = await supabase
        .from("client_progress_feedback")
        .select("id, implementation_status, ai_usage_frequency, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (feedbackError) throw feedbackError;
      setFeedbackHistory((feedback || []) as FeedbackData[]);

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("consulting_sessions")
        .select("id, session_date, status")
        .eq("client_id", clientId)
        .order("session_date", { ascending: true });

      if (sessionsError) throw sessionsError;
      setSessions((sessionsData || []) as SessionData[]);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare timeline data for implementation status
  const timelineData = feedbackHistory.map((f, index) => ({
    date: format(new Date(f.created_at), "dd/MM", { locale: ptBR }),
    status: f.implementation_status,
    statusLabel: statusLabels[f.implementation_status] || f.implementation_status,
    progressValue: 
      f.implementation_status === "completed" ? 100 :
      f.implementation_status === "in_progress" ? 60 :
      f.implementation_status === "blocked" ? 40 : 10,
  }));

  // AI usage frequency distribution
  const frequencyDistribution = feedbackHistory.reduce((acc, f) => {
    if (f.ai_usage_frequency) {
      acc[f.ai_usage_frequency] = (acc[f.ai_usage_frequency] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(frequencyDistribution).map(([key, value]) => ({
    name: frequencyLabels[key] || key,
    value,
  }));

  // Sessions per month
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return {
      month: format(date, "MMM/yy", { locale: ptBR }),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  const sessionsPerMonth = last6Months.map(({ month, start, end }) => {
    const count = sessions.filter(s => {
      const sessionDate = new Date(s.session_date);
      return sessionDate >= start && sessionDate <= end && s.status === "completed";
    }).length;
    return { month, sessions: count };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (feedbackHistory.length === 0 && sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Nenhum dado disponível ainda. Complete atualizações de progresso para ver seus gráficos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Timeline */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolução da Implementação
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.date}</p>
                            <p className="text-sm text-primary">{data.statusLabel}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="progressValue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sessions per Month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sessões por Mês</CardTitle>
            <CardDescription>Reuniões realizadas nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="text-sm">
                              <span className="font-medium">{payload[0].payload.month}:</span>{" "}
                              {payload[0].value} sessão(ões)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Usage Distribution */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Frequência de Uso de IA</CardTitle>
              <CardDescription>Distribuição das suas respostas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="text-sm font-medium">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">
                                {payload[0].value} resposta(s)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
