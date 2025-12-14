import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FollowUpLog {
  id: string;
  lead_id: string;
  notification_type: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  lead?: {
    name: string;
    email: string;
  };
}

export function useFollowUpLogs() {
  const [logs, setLogs] = useState<FollowUpLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('follow_up_logs')
        .select(`
          *,
          lead:leads(name, email)
        `)
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setLogs((data || []) as FollowUpLog[]);
    } catch (error) {
      console.error('Error fetching follow-up logs:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    refetch: fetchLogs,
  };
}
