import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, MessageCircle, Instagram, Facebook, Send, Mail, Music2, Bot, Clock, TrendingUp, Users } from "lucide-react";
import { useChannelAnalytics, ChannelMetrics, ChannelType } from "@/hooks/useChannelAnalytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { MessageEvolutionChart } from "./MessageEvolutionChart";
import { AnalyticsExport } from "./AnalyticsExport";

const CHANNEL_INFO: Record<ChannelType, { name: string; icon: typeof MessageCircle; color: string }> = {
  whatsapp: { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500' },
  instagram: { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  facebook: { name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  tiktok: { name: 'TikTok', icon: Music2, color: 'bg-black' },
  telegram: { name: 'Telegram', icon: Send, color: 'bg-sky-500' },
  email: { name: 'Email', icon: Mail, color: 'bg-gray-600' },
};

function formatResponseTime(ms: number | null): string {
  if (ms === null) return '-';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function ChannelCard({ metrics }: { metrics: ChannelMetrics }) {
  const info = CHANNEL_INFO[metrics.channel];
  const Icon = info.icon;
  
  const responseRate = metrics.messagesReceived > 0 
    ? Math.round((metrics.messagesSent / metrics.messagesReceived) * 100)
    : 0;
  
  const aiRate = metrics.messagesSent > 0
    ? Math.round((metrics.aiResponses / metrics.messagesSent) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${info.color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base">{info.name}</CardTitle>
          </div>
          {metrics.unreadCount > 0 && (
            <Badge variant="destructive">{metrics.unreadCount} não lidas</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Conversas</p>
            <p className="text-xl font-bold">{metrics.totalConversations}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mensagens</p>
            <p className="text-xl font-bold">{metrics.totalMessages}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Recebidas:</span>
            <span className="font-medium">{metrics.messagesReceived}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Enviadas:</span>
            <span className="font-medium">{metrics.messagesSent}</span>
          </div>
        </div>

        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Respostas IA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.aiResponses}</span>
              <Badge variant="secondary" className="text-xs">{aiRate}%</Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tempo médio resposta</span>
            </div>
            <span className="font-medium">{formatResponseTime(metrics.avgResponseTimeMs)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChannelAnalytics() {
  const { metrics, loading, dateRange, setDateRange } = useChannelAnalytics();
  const [period, setPeriod] = useState('30');

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const days = parseInt(value);
    setDateRange({
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Analytics por Canal</h3>
          <p className="text-sm text-muted-foreground">
            Métricas de desempenho de cada canal de comunicação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AnalyticsExport dateRange={dateRange} />
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Conversas</p>
                <p className="text-2xl font-bold">{metrics.totalConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Mensagens</p>
                <p className="text-2xl font-bold">{metrics.totalMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Bot className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Respostas IA</p>
                <p className="text-2xl font-bold">{metrics.aiResponses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Não Lidas</p>
                <p className="text-2xl font-bold">{metrics.unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Evolution Chart */}
      <MessageEvolutionChart days={parseInt(period)} />

      {/* Channel Cards */}
      {metrics.byChannel.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.byChannel.map((channelMetrics) => (
            <ChannelCard key={channelMetrics.channel} metrics={channelMetrics} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma conversa encontrada no período selecionado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
