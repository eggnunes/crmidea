import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface CalendarToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<CalendarToken | null>(null);

  const checkConnection = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setTokenData(data);
      setIsConnected(!!data);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Always use the published domain for Google OAuth to avoid redirect_uri mismatch.
  // If the app is running on a preview URL, we still force the published URL.
  const getRedirectUri = () => {
    const publishedDomain = 'https://crmidea.lovable.app';
    const origin = typeof window !== 'undefined' ? window.location.origin : publishedDomain;
    const base = origin === publishedDomain ? origin : publishedDomain;
    return `${base}/configuracoes?google_callback=true`;
  };

  const getAuthUrl = async () => {
    if (!user) return null;

    try {
      const redirectUri = getRedirectUri();
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'get-auth-url',
          redirectUri,
          userId: user.id,
        },
      });

      if (error) throw error;
      return data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      toast.error('Erro ao iniciar autenticação com Google');
      return null;
    }
  };

  const connect = async () => {
    const authUrl = await getAuthUrl();
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  const handleCallback = async (code: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const redirectUri = getRedirectUri();

      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'exchange-code',
          code,
          redirectUri,
          userId: user.id,
        },
      });

      if (error) throw error;

      toast.success('Google Calendar conectado com sucesso!');
      await checkConnection();
      return true;
    } catch (error) {
      console.error('Error handling callback:', error);
      toast.error('Erro ao conectar Google Calendar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'disconnect',
          userId: user.id,
        },
      });

      if (error) throw error;

      setIsConnected(false);
      setTokenData(null);
      toast.success('Google Calendar desconectado');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const getValidAccessToken = async (): Promise<string | null> => {
    if (!user || !tokenData) return null;

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (expiresAt > now) {
      return tokenData.access_token;
    }

    // Refresh token
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'refresh-token',
          userId: user.id,
        },
      });

      if (error) throw error;
      
      await checkConnection();
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast.error('Erro ao atualizar token do Google Calendar');
      return null;
    }
  };

  const createCalendarEvent = async (session: {
    title: string;
    session_date: string;
    duration_minutes?: number;
    summary?: string;
    notes?: string;
    topics?: string[];
    next_steps?: string;
    attendees?: string[];
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'create-event',
          userId: user.id,
          session,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast.error('Erro ao criar evento no Google Calendar');
      return null;
    }
  };

  const listCalendars = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'list-calendars',
          userId: user.id,
          // Importante: páginas de agendamento (calendar.app) frequentemente ficam em calendários ocultos.
          includeHidden: true,
        },
      });

      if (error) throw error;
      return data.calendars || [];
    } catch (error) {
      console.error('Error listing calendars:', error);
      return [];
    }
  };

  const listEvents = async (
    calendarId?: string,
    options?: {
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
    }
  ) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'list-events',
          userId: user.id,
          ...(calendarId ? { calendarId } : {}),
          ...(options?.timeMin ? { timeMin: options.timeMin } : {}),
          ...(options?.timeMax ? { timeMax: options.timeMax } : {}),
          ...(typeof options?.maxResults === 'number' ? { maxResults: options.maxResults } : {}),
        },
      });

      if (error) throw error;
      return data.events || [];
    } catch (error) {
      console.error('Error listing events:', error);
      return [];
    }
  };

  return {
    isConnected,
    loading,
    connect,
    disconnect,
    handleCallback,
    getValidAccessToken,
    checkConnection,
    createCalendarEvent,
    listCalendars,
    listEvents,
  };
}
