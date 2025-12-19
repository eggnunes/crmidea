import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Plus, Trash2, Loader2, Clock, User } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, parseISO, addDays, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LocalSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booked_by_name?: string;
  booked_by_email?: string;
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
  const [slots, setSlots] = useState<LocalSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form states
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const [duration, setDuration] = useState('60');

  useEffect(() => {
    if (user) {
      fetchSlots();
      if (isConnected) {
        fetchCalendars();
      }
    }
  }, [isConnected, user]);

  const fetchCalendars = async () => {
    try {
      const list = await listCalendars();
      setCalendars(list);
      
      if (user && list.length > 0) {
        const { data } = await supabase
          .from('ai_assistant_config')
          .select('google_calendar_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.google_calendar_id) {
          setSelectedCalendar(data.google_calendar_id);
        } else {
          const primary = list.find((c: CalendarOption) => c.primary);
          setSelectedCalendar(primary?.id || list[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    }
  };

  const fetchSlots = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_availability' as any)
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSlots((data as unknown as LocalSlot[]) || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!user || !newDate) {
      toast.error('Selecione uma data');
      return;
    }

    setCreating(true);
    try {
      const startTime = new Date(newDate);
      const endTime = addMinutes(startTime, parseInt(duration));

      const { error } = await supabase
        .from('calendar_availability' as any)
        .insert({
          user_id: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          calendar_id: selectedCalendar || null,
          is_booked: false,
        } as any);

      if (error) throw error;

      // Optionally create in Google Calendar too
      if (isConnected && selectedCalendar) {
        try {
          await supabase.functions.invoke('google-calendar-sync', {
            body: {
              action: 'create-event',
              userId: user.id,
              calendarId: selectedCalendar,
              session: {
                title: 'Horário Disponível - Mentoria/Consultoria',
                session_date: startTime.toISOString(),
                duration_minutes: parseInt(duration),
                summary: 'Horário disponível para agendamento',
              },
            },
          });
        } catch (calError) {
          console.error('Error creating calendar event:', calError);
        }
      }

      toast.success('Horário criado com sucesso!');
      fetchSlots();
      setNewDate(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
    } catch (error) {
      console.error('Error creating slot:', error);
      toast.error('Erro ao criar horário');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_availability' as any)
        .delete()
        .eq('id', slotId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Horário removido');
      setSlots(slots.filter(s => s.id !== slotId));
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Erro ao remover horário');
    }
  };

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
        {/* Calendar Selector (optional) */}
        {isConnected && calendars.length > 0 && (
          <div className="space-y-2">
            <Label>Sincronizar com Google Calendar (opcional)</Label>
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
        )}

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
            Horários Cadastrados
            <Badge variant="secondary">{slots.length}</Badge>
          </h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum horário cadastrado</p>
              <p className="text-xs mt-1">Adicione horários para seus alunos poderem agendar</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      slot.is_booked 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'bg-background hover:bg-muted/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(slot.start_time), "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="font-medium text-sm">
                        {format(parseISO(slot.start_time), "HH:mm")} - {format(parseISO(slot.end_time), "HH:mm")}
                      </p>
                      {slot.is_booked && slot.booked_by_name && (
                        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                          <User className="h-3 w-3" />
                          <span>Agendado: {slot.booked_by_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.is_booked ? (
                        <Badge variant="default" className="bg-green-600">Agendado</Badge>
                      ) : (
                        <>
                          <Badge variant="outline">Disponível</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSlot(slot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
