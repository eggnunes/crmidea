import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ChartType = 'line' | 'bar';

interface DailyData {
  date: string;
  displayDate: string;
  received: number;
  sent: number;
  ai: number;
  total: number;
}

interface MessageEvolutionChartProps {
  days?: number;
}

export function MessageEvolutionChart({ days = 30 }: MessageEvolutionChartProps) {
  const { user } = useAuth();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      setLoading(true);
      try {
        const startDate = subDays(new Date(), days);
        
        const { data: messages, error } = await supabase
          .from('whatsapp_messages')
          .select('created_at, is_from_contact, is_ai_response')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString());

        if (error) throw error;

        // Create date range
        const dateRange = eachDayOfInterval({
          start: startDate,
          end: new Date(),
        });

        // Initialize data for each day
        const dailyMap = new Map<string, DailyData>();
        dateRange.forEach(date => {
          const dateKey = format(date, 'yyyy-MM-dd');
          dailyMap.set(dateKey, {
            date: dateKey,
            displayDate: format(date, 'dd/MM', { locale: ptBR }),
            received: 0,
            sent: 0,
            ai: 0,
            total: 0,
          });
        });

        // Aggregate messages by day
        (messages || []).forEach(msg => {
          const dateKey = format(new Date(msg.created_at), 'yyyy-MM-dd');
          const dayData = dailyMap.get(dateKey);
          
          if (dayData) {
            dayData.total++;
            if (msg.is_from_contact) {
              dayData.received++;
            } else {
              dayData.sent++;
              if (msg.is_ai_response) {
                dayData.ai++;
              }
            }
          }
        });

        setData(Array.from(dailyMap.values()));
      } catch (error) {
        console.error('Error fetching message evolution:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, days]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, day) => ({
        received: acc.received + day.received,
        sent: acc.sent + day.sent,
        ai: acc.ai + day.ai,
        total: acc.total + day.total,
      }),
      { received: 0, sent: 0, ai: 0, total: 0 }
    );
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Evolução de Mensagens</CardTitle>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
            <TabsList className="h-8">
              <TabsTrigger value="line" className="text-xs px-3">Linha</TabsTrigger>
              <TabsTrigger value="bar" className="text-xs px-3">Barras</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{totals.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">{totals.received}</p>
            <p className="text-xs text-muted-foreground">Recebidas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">{totals.sent}</p>
            <p className="text-xs text-muted-foreground">Enviadas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-500">{totals.ai}</p>
            <p className="text-xs text-muted-foreground">IA</p>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="received" 
                  name="Recebidas"
                  stroke="hsl(217, 91%, 60%)" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sent" 
                  name="Enviadas"
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ai" 
                  name="Respostas IA"
                  stroke="hsl(271, 91%, 65%)" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar 
                  dataKey="received" 
                  name="Recebidas"
                  fill="hsl(217, 91%, 60%)" 
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="sent" 
                  name="Enviadas"
                  fill="hsl(142, 76%, 36%)" 
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="ai" 
                  name="Respostas IA"
                  fill="hsl(271, 91%, 65%)" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
