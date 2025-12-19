import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FollowUpMetrics {
  totalSent: number;
  totalResponded: number;
  totalConverted: number;
  responseRate: number;
  conversionRate: number;
  byPeriod: {
    period: string;
    sent: number;
    responded: number;
    converted: number;
  }[];
  byChannel: {
    channel: string;
    sent: number;
    responded: number;
  }[];
  recentLogs: {
    id: string;
    lead_name: string;
    notification_type: string;
    status: string;
    sent_at: string;
  }[];
}

export function useFollowUpMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<FollowUpMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all follow-up logs
      const { data: logs, error: logsError } = await supabase
        .from('follow_up_logs')
        .select(`
          id,
          lead_id,
          notification_type,
          status,
          sent_at
        `)
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

      if (logsError) throw logsError;

      // Fetch lead names for recent logs
      const leadIds = [...new Set(logs?.map(l => l.lead_id) || [])];
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, status')
        .in('id', leadIds);

      const leadMap = new Map(leads?.map(l => [l.id, l]) || []);

      // Calculate metrics
      const totalSent = logs?.filter(l => l.status === 'sent').length || 0;
      
      // Get leads that had follow-ups and then had interactions (responded)
      const followedUpLeadIds = [...new Set(logs?.filter(l => l.status === 'sent').map(l => l.lead_id) || [])];
      
      const { data: interactions } = await supabase
        .from('interactions')
        .select('lead_id, date')
        .in('lead_id', followedUpLeadIds);

      // Count leads that had interactions after follow-up
      const respondedLeads = new Set<string>();
      const convertedLeads = new Set<string>();

      for (const leadId of followedUpLeadIds) {
        const leadLogs = logs?.filter(l => l.lead_id === leadId && l.status === 'sent') || [];
        const leadInteractions = interactions?.filter(i => i.lead_id === leadId) || [];
        const lead = leadMap.get(leadId);

        // Check if there was an interaction after any follow-up
        for (const log of leadLogs) {
          const followUpDate = new Date(log.sent_at);
          const hasResponseAfter = leadInteractions.some(i => new Date(i.date) > followUpDate);
          if (hasResponseAfter) {
            respondedLeads.add(leadId);
          }
        }

        // Check if lead was converted
        if (lead?.status === 'fechado_ganho') {
          convertedLeads.add(leadId);
        }
      }

      const totalResponded = respondedLeads.size;
      const totalConverted = convertedLeads.size;
      const responseRate = totalSent > 0 ? (totalResponded / followedUpLeadIds.length) * 100 : 0;
      const conversionRate = followedUpLeadIds.length > 0 ? (totalConverted / followedUpLeadIds.length) * 100 : 0;

      // Group by period (last 7 days)
      const byPeriod: FollowUpMetrics['byPeriod'] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = logs?.filter(l => l.sent_at.startsWith(dateStr) && l.status === 'sent') || [];
        
        byPeriod.push({
          period: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
          sent: dayLogs.length,
          responded: 0, // Would need more complex calculation
          converted: 0,
        });
      }

      // Group by channel
      const channelCounts: Record<string, { sent: number; responded: number }> = {};
      for (const log of logs || []) {
        if (log.status === 'sent') {
          const channel = log.notification_type || 'unknown';
          if (!channelCounts[channel]) {
            channelCounts[channel] = { sent: 0, responded: 0 };
          }
          channelCounts[channel].sent++;
        }
      }

      const byChannel = Object.entries(channelCounts).map(([channel, counts]) => ({
        channel: channel === 'in_app' ? 'Notificação' : 
                 channel === 'whatsapp_zapi' ? 'WhatsApp' : 
                 channel === 'whatsapp' ? 'WhatsApp (ManyChat)' : channel,
        ...counts,
      }));

      // Recent logs with lead names
      const recentLogs = (logs?.slice(0, 10) || []).map(log => ({
        id: log.id,
        lead_name: leadMap.get(log.lead_id)?.name || 'Lead desconhecido',
        notification_type: log.notification_type,
        status: log.status,
        sent_at: log.sent_at,
      }));

      setMetrics({
        totalSent,
        totalResponded,
        totalConverted,
        responseRate,
        conversionRate,
        byPeriod,
        byChannel,
        recentLogs,
      });
    } catch (error) {
      console.error('Error fetching follow-up metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    refetch: fetchMetrics,
  };
}
