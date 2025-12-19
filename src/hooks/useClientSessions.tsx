import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useGoogleCalendar } from './useGoogleCalendar';

export interface ClientSession {
  id: string;
  client_id: string;
  user_id: string;
  session_date: string;
  duration_minutes: number;
  session_type: string;
  title: string;
  summary: string | null;
  notes: string | null;
  topics: string[];
  next_steps: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type SessionInsert = Omit<ClientSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type SessionUpdate = Partial<SessionInsert>;

export function useClientSessions(clientId?: string) {
  const { user } = useAuth();
  const { isConnected: googleCalendarConnected, createCalendarEvent } = useGoogleCalendar();
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    if (!user || !clientId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('client_sessions')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .order('session_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user, clientId]);

  const addSession = async (session: SessionInsert, syncToCalendar: boolean = true) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('client_sessions')
        .insert({
          ...session,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add timeline event
      await supabase.from('client_timeline').insert({
        client_id: session.client_id,
        user_id: user.id,
        event_type: 'sessao_realizada',
        title: session.title,
        description: session.summary || 'Sessão registrada',
        reference_id: data.id,
        reference_type: 'session',
        event_date: session.session_date,
      });

      // Sync to Google Calendar if connected and enabled
      if (syncToCalendar && googleCalendarConnected) {
        try {
          await createCalendarEvent({
            title: session.title,
            session_date: session.session_date,
            duration_minutes: session.duration_minutes,
            summary: session.summary || undefined,
            notes: session.notes || undefined,
            topics: session.topics,
            next_steps: session.next_steps || undefined,
          });
          toast.success('Sessão registrada e sincronizada com Google Calendar!');
        } catch (calError) {
          console.error('Error syncing to calendar:', calError);
          toast.success('Sessão registrada! (Falha ao sincronizar com calendário)');
        }
      } else {
        toast.success('Sessão registrada!');
      }

      setSessions(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding session:', error);
      toast.error('Erro ao registrar sessão');
      return null;
    }
  };

  const updateSession = async (id: string, updates: SessionUpdate) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('client_sessions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      toast.success('Sessão atualizada!');
      return true;
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Erro ao atualizar sessão');
      return false;
    }
  };

  const deleteSession = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('client_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Sessão removida');
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Erro ao remover sessão');
      return false;
    }
  };

  // Get sessions grouped by topic
  const sessionsByTopic = sessions.reduce((acc, session) => {
    session.topics.forEach(topic => {
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(session);
    });
    return acc;
  }, {} as Record<string, ClientSession[]>);

  return {
    sessions,
    sessionsByTopic,
    loading,
    addSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions,
    googleCalendarConnected,
  };
}

