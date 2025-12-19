import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Plus, Trash2, Loader2, Clock, ExternalLink } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AvailableSlot {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string;
}

interface CalendarOption {
  id: string;
  summary: string;
  primary?: boolean;
}

export function AvailabilityManager() {
  const { isConnected, listCalendars } = useGoogleCalendar();
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form states
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const [duration, setDuration] = useState('60');
  const [slotTitle, setSlotTitle] = useState('Horário Disponível - Mentoria');

  useEffect(() => {
    if (isConnected && user) {
      fetchCalendars();
    }
  }, [isConnected, user]);

  useEffect(() => {
    if (selectedCalendar) {
      fetchAvailableSlots();
    }
  }, [selectedCalendar]);

  const fetchCalendars = async () => {
    try {
      const list = await listCalendars();
      setCalendars(list);
      
      // Try to load saved calendar from config
      if (user) {
        const { data } = await supabase
          .from('ai_assistant_config')
          .select('google_calendar_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.google_calendar_id) {
          setSelectedCalendar(data.google_calendar_id);
        } else if (list.length > 0) {
          const primary = list.find((c: CalendarOption) => c.primary);
          setSelectedCalendar(primary?.id || list[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!user || !selectedCalendar) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'list-events',
          userId: user.id,
          calendarId: selectedCalendar,
        },
      });

      if (error) throw error;

      // Filter to show only availability slots (you can customize this filter)
      const availabilitySlots = data.events?.filter((event: AvailableSlot) => 
        event.summary?.toLowerCase().includes('disponível') || 
        event.summary?.toLowerCase().includes('mentoria') ||
        event.summary?.toLowerCase().includes('consultoria')
      ) || [];

      setSlots(availabilitySlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!user || !selectedCalendar || !newDate) {
      toast.error('Selecione uma data e calendário');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'create-event',
          userId: user.id,
          calendarId: selectedCalendar,
          session: {
            title: slotTitle,
            session_date: new Date(newDate).toISOString(),
            duration_minutes: parseInt(duration),
            summary: 'Horário disponível para agendamento de mentoria/consultoria',
          },
        },
      });

      if (error) throw error;

      toast.success('Horário criado com sucesso!');
      fetchAvailableSlots();
      setNewDate(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
    } catch (error) {
      console.error('Error creating slot:', error);
      toast.error('Erro ao criar horário');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSlot = async (eventId: string) => {
    if (!user || !selectedCalendar) return;

    try {
      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'delete-event',
          userId: user.id,
          calendarId: selectedCalendar,
          eventId,
        },
      });

      if (error) throw error;

      toast.success('Horário removido');
      setSlots(slots.filter(s => s.id !== eventId));
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Erro ao remover horário');
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Conecte seu Google Calendar para gerenciar disponibilidade</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Gerenciar Disponibilidade
        </CardTitle>
        <CardDescription>
          Crie horários disponíveis para seus alunos agendarem mentorias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calendar Selector */}
        <div className="space-y-2">
          <Label>Calendário</Label>
          <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um calendário" />
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

        {/* Create New Slot */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
          <h4 className="font-medium">Adicionar Novo Horário</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slot-date">Data e Hora</Label>
              <Input
                id="slot-date"
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slot-duration">Duração</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="slot-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h30min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot-title">Título do Horário</Label>
            <Input
              id="slot-title"
              value={slotTitle}
              onChange={(e) => setSlotTitle(e.target.value)}
              placeholder="Ex: Horário Disponível - Mentoria"
            />
          </div>

          <Button onClick={handleCreateSlot} disabled={creating} className="w-full">
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Horário
              </>
            )}
          </Button>
        </div>

        {/* Available Slots List */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center justify-between">
            Horários Disponíveis
            <Badge variant="secondary">{slots.length}</Badge>
          </h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum horário disponível cadastrado</p>
              <p className="text-xs mt-1">Adicione horários para seus alunos poderem agendar</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{slot.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(slot.start), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={slot.htmlLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSlot(slot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
