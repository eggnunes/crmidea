import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

type CalendarOption = { id: string; summary: string; primary?: boolean };

type CreateClientMeetingDialogProps = {
  clientId: string;
  clientName: string;
  clientEmail: string;
  onCreated?: () => void;
};

export function CreateClientMeetingDialog({ clientId, clientName, clientEmail, onCreated }: CreateClientMeetingDialogProps) {
  const { user } = useAuth();
  const { isConnected, listCalendars, createCalendarEvent } = useGoogleCalendar();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);

  const [title, setTitle] = useState<string>(`Consultoria - ${clientName}`);
  const [dateTime, setDateTime] = useState<string>(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [duration, setDuration] = useState<number>(60);
  const [calendarId, setCalendarId] = useState<string>("primary");

  const canUse = useMemo(() => !!user?.id && isConnected, [user?.id, isConnected]);

  useEffect(() => {
    if (!open || !isConnected) return;

    setLoadingCalendars(true);
    listCalendars()
      .then((list) => {
        const normalized = (list || []) as CalendarOption[];
        setCalendars(normalized);
        const primary = normalized.find((c) => c.primary);
        if (primary?.id) setCalendarId(primary.id);
      })
      .catch((e) => console.error("Error listing calendars:", e))
      .finally(() => setLoadingCalendars(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isConnected]);

  useEffect(() => {
    if (!open) return;
    setTitle(`Consultoria - ${clientName}`);
  }, [open, clientName]);

  const handleCreate = async () => {
    if (!canUse) {
      toast.error("Conecte o Google Calendar para criar eventos");
      return;
    }

    if (!title.trim() || !dateTime) {
      toast.error("Preencha título e data");
      return;
    }

    setSaving(true);
    try {
      const sessionDateIso = new Date(dateTime).toISOString();

      const eventResp = await createCalendarEvent({
        title: title.trim(),
        session_date: sessionDateIso,
        duration_minutes: duration,
        summary: `Reunião com ${clientName}`,
        notes: `Cliente: ${clientName}\nE-mail: ${clientEmail}`,
        attendees: [clientEmail],
      });

      if (!eventResp?.eventId) {
        throw new Error("Falha ao criar evento no Google Calendar");
      }

      const { error } = await supabase.from("consulting_sessions").insert({
        client_id: clientId,
        user_id: user!.id,
        title: title.trim(),
        session_date: sessionDateIso,
        duration_minutes: duration,
        session_type: "online",
        status: "scheduled",
        google_event_id: eventResp.eventId,
        google_event_link: eventResp.eventLink || null,
        google_calendar_id: calendarId,
      });

      if (error) throw error;

      toast.success("Reunião criada e registrada!");
      setOpen(false);
      onCreated?.();
    } catch (e) {
      console.error("Error creating client meeting:", e);
      toast.error("Erro ao criar reunião");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={!isConnected}>
          <CalendarPlus className="w-4 h-4" />
          Criar reunião
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar reunião para este cliente</DialogTitle>
          <DialogDescription>
            Cria o evento no Google Calendar, adiciona o cliente como participante e registra no histórico.
          </DialogDescription>
        </DialogHeader>

        {!isConnected ? (
          <div className="text-sm text-muted-foreground">
            Conecte o Google Calendar para usar esta função.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="meeting-title">Título</Label>
              <Input id="meeting-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meeting-date">Data e hora</Label>
                <Input
                  id="meeting-date"
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="meeting-duration">Duração (min)</Label>
                <Input
                  id="meeting-duration"
                  type="number"
                  min={15}
                  step={15}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                />
              </div>
            </div>

            <div>
              <Label>Calendário</Label>
              <Select value={calendarId} onValueChange={setCalendarId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCalendars ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primário</SelectItem>
                  {calendars
                    .filter((c) => c.id !== "primary")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.summary}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Participante: <span className="font-medium text-foreground">{clientEmail}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!isConnected || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
