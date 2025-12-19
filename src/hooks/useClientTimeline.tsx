import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TimelineEvent {
  id: string;
  client_id: string;
  user_id: string;
  event_type: string;
  title: string;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  event_date: string;
  created_at: string;
}

export type TimelineInsert = Omit<TimelineEvent, 'id' | 'user_id' | 'created_at'>;

export function useClientTimeline(clientId?: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    if (!user || !clientId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('client_timeline')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast.error('Erro ao carregar linha do tempo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user, clientId]);

  const addEvent = async (event: TimelineInsert) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('client_timeline')
        .insert({
          ...event,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Erro ao adicionar evento');
      return null;
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('client_timeline')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success('Evento removido');
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erro ao remover evento');
      return false;
    }
  };

  return {
    events,
    loading,
    addEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
}
