import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, MessageCircle, Instagram, Facebook, Send, Mail, Music2 } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

type ChartType = 'line' | 'bar';
type ChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'email' | 'telegram';

interface DailyData {
  date: string;
  displayDate: string;
  received: number;
  sent: number;
  ai: number;
  total: number;
}

interface ChannelDistribution {
  name: string;
  value: number;
  color: string;
}

interface MessageEvolutionChartProps {
  days?: number;
}

const CHANNEL_CONFIG: Record<ChannelType, { name: string; color: string; icon: typeof MessageCircle }> = {
  whatsapp: { name: 'WhatsApp', color: 'hsl(142, 70%, 45%)', icon: MessageCircle },
  instagram: { name: 'Instagram', color: 'hsl(328, 85%, 60%)', icon: Instagram },
  facebook: { name: 'Facebook', color: 'hsl(217, 89%, 55%)', icon: Facebook },
  tiktok: { name: 'TikTok', color: 'hsl(0, 0%, 10%)', icon: Music2 },
  telegram: { name: 'Telegram', color: 'hsl(200, 80%, 55%)', icon: Send },
  email: { name: 'Email', color: 'hsl(0, 0%, 45%)', icon: Mail },
};

export function MessageEvolutionChart({ days = 30 }: MessageEvolutionChartProps) {
  const { user } = useAuth();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [data, setData] = useState<DailyData[]>([]);
  const [channelDistribution, setChannelDistribution] = useState<ChannelDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<Set<ChannelType>>(new Set(['whatsapp', 'instagram', 'facebook', 'tiktok', 'telegram', 'email']));

  const toggleChannel = (channel: ChannelType) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channel)) {
        if (next.size > 1) next.delete(channel);
      } else {
        next.add(channel);
      }
      return next;
    });
  };

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      setLoading(true);
      try {
        const startDate = subDays(new Date(), days);
        
        const { data: messages, error } = await supabase
          .from('whatsapp_messages')
          .select('created_at, is_from_contact, is_ai_response, channel')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString());

        if (error) throw error;

        // Filter by selected channels
        const filteredMessages = (messages || []).filter(msg => 
          selectedChannels.has((msg.channel as ChannelType) || 'whatsapp')
        );

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

        // Calculate channel distribution
        const channelCounts = new Map<ChannelType, number>();
        Object.keys(CHANNEL_CONFIG).forEach(ch => channelCounts.set(ch as ChannelType, 0));

        // Aggregate messages by day and channel
        (messages || []).forEach(msg => {
          const channel = (msg.channel as ChannelType) || 'whatsapp';
          channelCounts.set(channel, (channelCounts.get(channel) || 0) + 1);
        });

        filteredMessages.forEach(msg => {
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
        
        // Set channel distribution for pie chart
        const distribution: ChannelDistribution[] = [];
        channelCounts.forEach((count, channel) => {
          if (count > 0) {
            distribution.push({
              name: CHANNEL_CONFIG[channel].name,
              value: count,
              color: CHANNEL_CONFIG[channel].color,
            });
          }
        });
        setChannelDistribution(distribution);

      } catch (error) {
        console.error('Error fetching message evolution:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, days, selectedChannels]);

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
    <div className="space-y-4">
      {/* Channel Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtrar por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CHANNEL_CONFIG) as ChannelType[]).map(channel => {
              const config = CHANNEL_CONFIG[channel];
              const Icon = config.icon;
              const isSelected = selectedChannels.has(channel);
              
              return (
                <Badge
                  key={channel}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer flex items-center gap-1.5 py-1.5 px-3 transition-all"
                  style={{
                    backgroundColor: isSelected ? config.color : 'transparent',
                    borderColor: config.color,
                    color: isSelected ? 'white' : config.color,
                  }}
                  onClick={() => toggleChannel(channel)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.name}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Evolution Chart */}
        <Card className="lg:col-span-2">
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

            <div className="h-[280px]">
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

        {/* Pie Chart - Channel Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {channelDistribution.length > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {channelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} mensagens`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {channelDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Nenhuma mensagem no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
