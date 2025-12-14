import { History, CheckCircle, XCircle, Bell, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFollowUpLogs } from "@/hooks/useFollowUpLogs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function FollowUpLogsCard() {
  const { logs, loading } = useFollowUpLogs();

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'in_app':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'in_app':
        return 'No App';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Histórico de Follow-ups
        </CardTitle>
        <CardDescription>
          Notificações de follow-up enviadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma notificação enviada ainda</p>
            <p className="text-sm">As notificações aparecerão aqui quando forem enviadas</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className={`p-2 rounded-full ${
                    log.status === 'sent' 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {log.status === 'sent' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">
                        {log.lead?.name || 'Lead removido'}
                      </span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getNotificationTypeIcon(log.notification_type)}
                        {getNotificationTypeLabel(log.notification_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {log.lead?.email || '—'}
                    </p>
                    {log.error_message && (
                      <p className="text-sm text-destructive mt-1">
                        Erro: {log.error_message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.sent_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
