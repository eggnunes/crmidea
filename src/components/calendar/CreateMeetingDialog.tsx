import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Loader2 } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CreateMeetingDialogProps {
  trigger?: React.ReactNode;
  defaultTitle?: string;
  defaultDate?: string;
  onCreated?: () => void;
}

interface CalendarOption {
  id: string;
  summary: string;
  primary?: boolean;
}

export function CreateMeetingDialog({ trigger, defaultTitle, defaultDate, onCreated }: CreateMeetingDialogProps) {
  const { isConnected, createCalendarEvent, listCalendars } = useGoogleCalendar();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  
  const [title, setTitle] = useState(defaultTitle || '');
  const [date, setDate] = useState(defaultDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [duration, setDuration] = useState('60');
  const [description, setDescription] = useState('');
  const [selectedCalendar, setSelectedCalendar] = useState('primary');

  useEffect(() => {
    if (open && isConnected) {
      fetchCalendars();
    }
  }, [open, isConnected]);

  useEffect(() => {
    if (defaultTitle) setTitle(defaultTitle);
    if (defaultDate) setDate(defaultDate);
  }, [defaultTitle, defaultDate]);

  const fetchCalendars = async () => {
    setLoadingCalendars(true);
    try {
      const list = await listCalendars();
      setCalendars(list);
      const primary = list.find((c: CalendarOption) => c.primary);
      if (primary) setSelectedCalendar(primary.id);
    } catch (error) {
      console.error('Error fetching calendars:', error);
    } finally {
      setLoadingCalendars(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !date) {
      toast.error('Preencha o título e a data');
      return;
    }

    setLoading(true);
    try {
      const result = await createCalendarEvent({
        title,
        session_date: new Date(date).toISOString(),
        duration_minutes: parseInt(duration),
        summary: description,
      });

      if (result) {
        toast.success('Evento criado com sucesso!');
        setOpen(false);
        setTitle('');
        setDescription('');
        onCreated?.();
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Agendar Reunião
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Reunião
          </DialogTitle>
          <DialogDescription>
            Crie um novo evento no seu Google Calendar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ex: Reunião com cliente"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data e Hora</Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendar">Calendário</Label>
            <Select value={selectedCalendar} onValueChange={setSelectedCalendar} disabled={loadingCalendars}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCalendars ? 'Carregando...' : 'Selecione um calendário'} />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    {cal.summary} {cal.primary && '(Principal)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Adicione detalhes sobre a reunião..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Evento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
