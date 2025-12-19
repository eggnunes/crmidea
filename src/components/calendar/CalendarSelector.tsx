import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Loader2, Check, RefreshCw } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CalendarOption {
  id: string;
  summary: string;
  primary?: boolean;
}

export function CalendarSelector() {
  const { isConnected, listCalendars } = useGoogleCalendar();
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [currentConfig, setCurrentConfig] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && user) {
      fetchCalendars();
      loadCurrentConfig();
    }
  }, [isConnected, user]);

  const fetchCalendars = async () => {
    setLoading(true);
    try {
      const list = await listCalendars();
      setCalendars(list);
    } catch (error) {
      console.error('Error fetching calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentConfig = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_assistant_config')
        .select('google_calendar_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.google_calendar_id) {
        setSelectedCalendar(data.google_calendar_id);
        setCurrentConfig(data.google_calendar_id);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !selectedCalendar) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_assistant_config')
        .upsert({
          user_id: user.id,
          google_calendar_id: selectedCalendar,
          google_calendar_enabled: true,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setCurrentConfig(selectedCalendar);
      toast.success('Calendário salvo com sucesso!');
    } catch (error) {
      console.error('Error saving calendar:', error);
      toast.error('Erro ao salvar calendário');
    } finally {
      setSaving(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  const selectedCalendarName = calendars.find(c => c.id === selectedCalendar)?.summary;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Calendário para Mentorias
        </CardTitle>
        <CardDescription>
          Selecione o calendário onde suas sessões de mentoria serão criadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Calendário</Label>
          <div className="flex gap-2">
            <Select value={selectedCalendar} onValueChange={setSelectedCalendar} disabled={loading}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={loading ? 'Carregando calendários...' : 'Selecione um calendário'} />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    {cal.summary} {cal.primary && '(Principal)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchCalendars} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {currentConfig && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>Calendário atual: <strong>{selectedCalendarName || currentConfig}</strong></span>
          </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={saving || !selectedCalendar || selectedCalendar === currentConfig}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Calendário'
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Este calendário será usado para sincronizar automaticamente as sessões de clientes e para gerenciar sua disponibilidade.
        </p>
      </CardContent>
    </Card>
  );
}
