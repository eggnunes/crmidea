import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Plus, Trash2, Loader2, Clock, RefreshCw, User, Link2 } from 'lucide-react';
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
  hidden?: boolean;
}

type GoogleCalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string;
};

export function AvailabilityManager() {
  const { isConnected, listCalendars, listEvents } = useGoogleCalendar();
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [slots, setSlots] = useState<LocalSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [calendarAppUrl, setCalendarAppUrl] = useState<string>('');
  const [savingCalendarAppUrl, setSavingCalendarAppUrl] = useState(false);
  const [syncingCalendarApp, setSyncingCalendarApp] = useState(false);

  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  
  // Form states
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const [duration, setDuration] = useState('60');

  useEffect(() => {
    if (user) {
      fetchSlots();
      if (isConnected) {
        fetchCalendars();
      }
      fetchBookingSettings();
    }
  }, [isConnected, user]);

  useEffect(() => {
    if (!isConnected) return;
    if (!selectedCalendar) return;

    // Fonte calendar.app: sincroniza via scraper e mostra slots do banco
    if (selectedCalendar === 'calendarapp') {
      if (calendarAppUrl) {
        void syncFromCalendarApp();
      }
      void fetchSlots('calendarapp');
      return;
    }

    // Fonte Google Calendar: mostra eventos do calendário selecionado
    fetchGoogleAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, selectedCalendar]);

  const fetchBookingSettings = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('booking_page_settings' as any)
        .select('calendar_app_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      const url = (data as any)?.calendar_app_url as string | null | undefined;
      if (url) setCalendarAppUrl(url);
    } catch (e) {
      console.error('Error fetching booking settings:', e);
    }
  };

  const saveCalendarAppUrl = async () => {
    if (!user?.id) return;
    const url = (calendarAppUrl || '').trim();
    if (!url) {
      toast.error('Cole o link da página (calendar.app)');
      return;
    }
    setSavingCalendarAppUrl(true);
    try {
      const { error } = await supabase
        .from('booking_page_settings' as any)
        .upsert({
          user_id: user.id,
          calendar_app_url: url,
        } as any, { onConflict: 'user_id' as any });
      if (error) throw error;
      toast.success('Link salvo');
      // Garante que a opção apareça no seletor
      await fetchCalendars();
    } catch (e) {
      console.error('Error saving calendar app url:', e);
      toast.error('Erro ao salvar link');
    } finally {
      setSavingCalendarAppUrl(false);
    }
  };

  const syncFromCalendarApp = async () => {
    if (!user?.id) return;
    const url = (calendarAppUrl || '').trim();
    if (!url) {
      toast.error('Cole o link da página (calendar.app)');
      return;
    }
    setSyncingCalendarApp(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calendarapp-availability', {
        body: {
          url,
          timezone: 'America/Sao_Paulo',
        },
      });
      if (error) throw error;
      toast.success(`Disponibilidade sincronizada (${data?.inserted ?? 0} novos)`);
      await fetchSlots('calendarapp');
    } catch (e) {
      console.error('Error syncing from calendar.app:', e);
      toast.error('Não foi possível sincronizar pelo link (calendar.app)');
    } finally {
      setSyncingCalendarApp(false);
    }
  };

  const syncGoogleToDatabase = async (evs: GoogleCalendarEvent[]) => {
    if (!user?.id || !selectedCalendar) return;

    // Normaliza e remove eventos inválidos
    const normalized = (evs || [])
      .filter((e) => Boolean(e.start) && Boolean(e.end))
      .map((e) => ({
        start_time: new Date(e.start).toISOString(),
        end_time: new Date(e.end).toISOString(),
      }))
      // remove possíveis NaN
      .filter((e) => !Number.isNaN(new Date(e.start_time).getTime()) && !Number.isNaN(new Date(e.end_time).getTime()));

    const key = (s: { start_time: string; end_time: string }) => `${s.start_time}|${s.end_time}`;
    const desiredKeys = new Set(normalized.map(key));

    // Carrega slots futuros não agendados para este calendário
    const { data: existing, error: existingError } = await supabase
      .from('calendar_availability' as any)
      .select('id, start_time, end_time, is_booked')
      .eq('user_id', user.id)
      .eq('calendar_id', selectedCalendar)
      .gte('start_time', new Date().toISOString());

    if (existingError) {
      console.error('Error fetching existing availability slots:', existingError);
      return;
    }

    const existingRows = ((existing as any[]) || []).map((r) => ({
      id: r.id as string,
      start_time: r.start_time as string,
      end_time: r.end_time as string,
      is_booked: Boolean(r.is_booked),
    }));

    const existingKeys = new Set(existingRows.map((r) => key({ start_time: r.start_time, end_time: r.end_time })));

    const toInsert = normalized
      .filter((s) => !existingKeys.has(key(s)))
      .map((s) => ({
        user_id: user.id,
        calendar_id: selectedCalendar,
        start_time: s.start_time,
        end_time: s.end_time,
        is_booked: false,
      }));

    const toDeleteIds = existingRows
      .filter((r) => !r.is_booked)
      .filter((r) => !desiredKeys.has(key({ start_time: r.start_time, end_time: r.end_time })))
      .map((r) => r.id);

    if (toInsert.length) {
      const { error: insertError } = await supabase.from('calendar_availability' as any).insert(toInsert as any);
      if (insertError) {
        console.error('Error inserting availability slots:', insertError);
      }
    }

    if (toDeleteIds.length) {
      const { error: deleteError } = await supabase
        .from('calendar_availability' as any)
        .delete()
        .in('id', toDeleteIds);

      if (deleteError) {
        console.error('Error deleting stale availability slots:', deleteError);
      }
    }
  };

  const fetchCalendars = async () => {
    try {
      const list = await listCalendars();
      // Adiciona a fonte "calendar.app" como opção fixa no seletor
      const withCalendarApp: CalendarOption[] = [
        {
          id: 'calendarapp',
          summary: 'Página de agendamento (calendar.app)',
        },
        ...(list || []),
      ];
      setCalendars(withCalendarApp);
      
      if (user && withCalendarApp.length > 0) {
        const { data } = await supabase
          .from('ai_assistant_config')
          .select('google_calendar_id')
          .eq('user_id', user.id)
          .maybeSingle();

        const configured = data?.google_calendar_id;
        const configuredExists = configured ? withCalendarApp.some((c) => c.id === configured) : false;
        if (configured && configuredExists) {
          setSelectedCalendar(configured);
          return;
        }

        // Fallback: tenta achar o calendário pelo nome (ex.: "Consultoria e Mentoria Individual IDEA")
        const byName = withCalendarApp.find((c) => (c.summary || '').toLowerCase().includes('consultoria') && (c.summary || '').toLowerCase().includes('mentoria'));
        const primary = withCalendarApp.find((c: CalendarOption) => c.primary);
        setSelectedCalendar(byName?.id || primary?.id || 'calendarapp');
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    }
  };

  const fetchSlots = async (calendarId?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let q = supabase
        .from('calendar_availability' as any)
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      // Quando o usuário escolhe uma fonte específica, filtramos por calendar_id
      if (calendarId) {
        q = q.eq('calendar_id', calendarId);
      }

      const { data, error } = await q;

      if (error) throw error;
      setSlots((data as unknown as LocalSlot[]) || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleAvailability = async () => {
    if (!isConnected || !selectedCalendar) return;
    if (selectedCalendar === 'calendarapp') return;
    setLoadingGoogle(true);
    try {
      const now = new Date();
      const timeMax = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
      const evs = (await listEvents(selectedCalendar, {
        timeMin: now.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: 250,
      })) as GoogleCalendarEvent[];
      // Como este é um calendário dedicado (Consultoria e Mentoria Individual IDEA),
      // tratamos os eventos dele como a “fonte da verdade” da disponibilidade.
      const clean = (evs || []).filter((e) => Boolean(e.start) && Boolean(e.end));
      setGoogleEvents(clean);

      // Mantém a base de horários (usada na página /agendar) sincronizada com o Google.
      await syncGoogleToDatabase(clean);
      // Atualiza slots locais (para refletir agendamentos na página pública)
      fetchSlots(selectedCalendar);
    } catch (e) {
      console.error('Error fetching Google availability events:', e);
      toast.error('Erro ao carregar disponibilidade do Google Calendar');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const googleSlots = useMemo(() => {
    return [...googleEvents]
      .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())
      .map((ev) => ({
        id: ev.id,
        start_time: ev.start,
        end_time: ev.end,
        is_booked: false,
      })) as LocalSlot[];
  }, [googleEvents]);

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
      fetchSlots(selectedCalendar || undefined);
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
          {isConnected
            ? 'Mostra a disponibilidade diretamente do seu calendário do Google selecionado.'
            : 'Crie horários disponíveis para seus alunos agendarem mentorias'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calendar Selector */}
        {isConnected && calendars.length > 0 && (
          <div className="space-y-2">
            <Label>Calendário de disponibilidade</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
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
              {selectedCalendar === 'calendarapp' ? (
                <Button
                  variant="outline"
                  onClick={syncFromCalendarApp}
                  disabled={syncingCalendarApp || !calendarAppUrl}
                >
                  {syncingCalendarApp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={fetchGoogleAvailability}
                  disabled={loadingGoogle || !selectedCalendar}
                >
                  {loadingGoogle ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Configuração do link calendar.app */}
        {isConnected && selectedCalendar === 'calendarapp' && (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Link da página de agendamento (calendar.app)</h4>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="calendarapp-url">Cole aqui o link</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="calendarapp-url"
                  placeholder="https://calendar.app.google/..."
                  value={calendarAppUrl}
                  onChange={(e) => setCalendarAppUrl(e.target.value)}
                />
                <Button onClick={saveCalendarAppUrl} disabled={savingCalendarAppUrl}>
                  {savingCalendarAppUrl ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Observação: esta sincronização depende do conteúdo público do link (pode variar se o Google mudar a página).
              </p>
            </div>
          </div>
        )}

        {/* Create New Slot (fallback when not connected) */}
        {!isConnected && (
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
        )}

        {/* Available Slots List */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center justify-between">
            {isConnected
              ? (selectedCalendar === 'calendarapp' ? 'Horários da página (calendar.app)' : 'Horários no Google Calendar')
              : 'Horários Cadastrados'}
            <Badge variant="secondary">
              {isConnected
                ? (selectedCalendar === 'calendarapp' ? slots.length : googleSlots.length)
                : slots.length}
            </Badge>
          </h4>

          {(isConnected ? (selectedCalendar === 'calendarapp' ? loading : loadingGoogle) : loading) ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (isConnected ? (selectedCalendar === 'calendarapp' ? slots.length === 0 : googleSlots.length === 0) : slots.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {isConnected
                  ? (selectedCalendar === 'calendarapp'
                      ? 'Nenhum horário encontrado no link (calendar.app)'
                      : 'Nenhum horário encontrado neste calendário')
                  : 'Nenhum horário cadastrado'}
              </p>
              <p className="text-xs mt-1">
                {isConnected
                  ? (selectedCalendar === 'calendarapp'
                      ? 'Cole e salve o link e clique em atualizar para sincronizar.'
                      : 'Selecione o calendário correto (ex.: Consultoria e Mentoria Individual IDEA)')
                  : 'Adicione horários para seus alunos poderem agendar'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {(isConnected
                  ? (selectedCalendar === 'calendarapp' ? slots : googleSlots)
                  : slots
                ).map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      slot.is_booked
                        ? 'bg-primary/10 border-primary/20'
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
                         <div className="flex items-center gap-1 text-xs text-primary">
                          <User className="h-3 w-3" />
                          <span>Agendado: {slot.booked_by_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.is_booked ? (
                        <Badge variant="default">Agendado</Badge>
                      ) : (
                        <>
                          <Badge variant="outline">Disponível</Badge>
                          {!isConnected && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
