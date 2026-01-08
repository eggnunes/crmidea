import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, MessageCircle, X, ExternalLink } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientReminder {
  id: string;
  client_id: string;
  client_name: string;
  office_name: string;
  phone: string;
  last_meeting_date: string | null;
  days_since_meeting: number;
}

export function ConsultingReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ClientReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchClientsWithoutRecentMeetings = async () => {
      if (!user?.id) return;

      try {
        // Get all consulting clients
        const { data: clients, error: clientsError } = await supabase
          .from('consulting_clients')
          .select('id, full_name, office_name, phone, created_at')
          .eq('user_id', user.id)
          .in('status', ['pending', 'in_progress']);

        if (clientsError) throw clientsError;

        // Get last meeting for each client
        const clientReminders: ClientReminder[] = [];

        for (const client of clients || []) {
          const { data: sessions } = await supabase
            .from('consulting_sessions')
            .select('session_date')
            .eq('client_id', client.id)
            .eq('status', 'completed')
            .order('session_date', { ascending: false })
            .limit(1);

          const lastMeetingDate = sessions?.[0]?.session_date || null;
          const referenceDate = lastMeetingDate || client.created_at;
          const daysSince = differenceInDays(new Date(), new Date(referenceDate));

          // Alert if more than 30 days since last meeting
          if (daysSince >= 30) {
            clientReminders.push({
              id: client.id,
              client_id: client.id,
              client_name: client.full_name,
              office_name: client.office_name,
              phone: client.phone,
              last_meeting_date: lastMeetingDate,
              days_since_meeting: daysSince,
            });
          }
        }

        // Sort by days since meeting (most urgent first)
        clientReminders.sort((a, b) => b.days_since_meeting - a.days_since_meeting);
        setReminders(clientReminders);
      } catch (error) {
        console.error('Error fetching reminders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientsWithoutRecentMeetings();
  }, [user?.id]);

  const dismissReminder = (clientId: string) => {
    setDismissedIds(prev => new Set([...prev, clientId]));
    toast.success('Lembrete dispensado');
  };

  const openWhatsApp = (phone: string, clientName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${clientName.split(' ')[0]}! Tudo bem? Faz um tempo que não conversamos sobre sua consultoria. Podemos agendar uma reunião?`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const visibleReminders = reminders.filter(r => !dismissedIds.has(r.id));

  if (loading || visibleReminders.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5" />
          Clientes sem Reunião Recente
        </CardTitle>
        <CardDescription>
          {visibleReminders.length} cliente(s) sem reunião há mais de 30 dias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleReminders.slice(0, 5).map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-center justify-between p-3 bg-background rounded-lg border"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{reminder.client_name}</span>
                <Badge variant="outline" className="text-xs">
                  {reminder.days_since_meeting} dias
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{reminder.office_name}</p>
              {reminder.last_meeting_date && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  Última reunião: {format(new Date(reminder.last_meeting_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => openWhatsApp(reminder.phone, reminder.client_name)}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => dismissReminder(reminder.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {visibleReminders.length > 5 && (
          <p className="text-sm text-center text-muted-foreground">
            +{visibleReminders.length - 5} cliente(s) adicionais
          </p>
        )}
      </CardContent>
    </Card>
  );
}