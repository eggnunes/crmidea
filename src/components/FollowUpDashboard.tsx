import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFollowUpMetrics } from '@/hooks/useFollowUpMetrics';
import { 
  Send, 
  MessageCircle, 
  TrendingUp, 
  CheckCircle, 
  Loader2,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))'];

export function FollowUpDashboard() {
  const { metrics, loading } = useFollowUpMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Send className="w-12 h-12 text-muted-foreground mb-4" />
          <h4 className="font-semibold mb-2">Nenhum follow-up enviado</h4>
          <p className="text-sm text-muted-foreground">
            Configure as opções de follow-up para começar a rastrear métricas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Enviados
            </CardTitle>
            <Send className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSent}</div>
            <p className="text-xs text-muted-foreground">follow-ups enviados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Responderam
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalResponded}</div>
            <p className="text-xs text-muted-foreground">leads responderam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Resposta
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">dos leads responderam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{metrics.totalConverted} convertidos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart by Period */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follow-ups por Dia (últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.byPeriod.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.byPeriod}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Sem dados no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart by Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follow-ups por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.byChannel.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={metrics.byChannel}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sent"
                      label={({ channel, sent }) => `${channel}: ${sent}`}
                    >
                      {metrics.byChannel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Sem dados de canal
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Follow-ups Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentLogs.length > 0 ? (
            <div className="space-y-3">
              {metrics.recentLogs.map(log => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${log.status === 'sent' ? 'bg-success' : 'bg-destructive'}`} />
                    <div>
                      <p className="font-medium text-sm">{log.lead_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.notification_type === 'in_app' ? 'Notificação' : 
                         log.notification_type === 'whatsapp_zapi' ? 'WhatsApp' : 
                         log.notification_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(log.sent_at), { addSuffix: true, locale: ptBR })}
                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                      {log.status === 'sent' ? 'Enviado' : 'Falhou'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum follow-up registrado ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
