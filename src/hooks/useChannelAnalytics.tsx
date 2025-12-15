import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'email' | 'telegram';

export interface ChannelMetrics {
  channel: ChannelType;
  totalConversations: number;
  totalMessages: number;
  messagesReceived: number;
  messagesSent: number;
  aiResponses: number;
  unreadCount: number;
  avgResponseTimeMs: number | null;
  lastMessageAt: string | null;
}

export interface OverallMetrics {
  totalConversations: number;
  totalMessages: number;
  messagesReceived: number;
  messagesSent: number;
  aiResponses: number;
  unreadCount: number;
  byChannel: ChannelMetrics[];
}

export function useChannelAnalytics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<OverallMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date(),
  });

  const fetchMetrics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch conversations with channel info
      const { data: conversations, error: convError } = await supabase
        .from('whatsapp_conversations')
        .select('id, channel, unread_count, last_message_at')
        .eq('user_id', user.id);

      if (convError) throw convError;

      // Fetch messages within date range
      const { data: messages, error: msgError } = await supabase
        .from('whatsapp_messages')
        .select('id, conversation_id, is_from_contact, is_ai_response, created_at, channel')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (msgError) throw msgError;

      // Calculate metrics by channel
      const channelMap = new Map<ChannelType, ChannelMetrics>();
      const channels: ChannelType[] = ['whatsapp', 'instagram', 'facebook', 'tiktok', 'email', 'telegram'];

      channels.forEach(channel => {
        channelMap.set(channel, {
          channel,
          totalConversations: 0,
          totalMessages: 0,
          messagesReceived: 0,
          messagesSent: 0,
          aiResponses: 0,
          unreadCount: 0,
          avgResponseTimeMs: null,
          lastMessageAt: null,
        });
      });

      // Process conversations
      (conversations || []).forEach(conv => {
        const channel = (conv.channel as ChannelType) || 'whatsapp';
        const metrics = channelMap.get(channel)!;
        metrics.totalConversations++;
        metrics.unreadCount += conv.unread_count || 0;
        
        if (conv.last_message_at && (!metrics.lastMessageAt || conv.last_message_at > metrics.lastMessageAt)) {
          metrics.lastMessageAt = conv.last_message_at;
        }
      });

      // Process messages
      const conversationMessages = new Map<string, { received: Date[]; sent: Date[] }>();
      
      (messages || []).forEach(msg => {
        const channel = (msg.channel as ChannelType) || 'whatsapp';
        const metrics = channelMap.get(channel)!;
        metrics.totalMessages++;
        
        if (msg.is_from_contact) {
          metrics.messagesReceived++;
        } else {
          metrics.messagesSent++;
          if (msg.is_ai_response) {
            metrics.aiResponses++;
          }
        }

        // Track for response time calculation
        if (!conversationMessages.has(msg.conversation_id)) {
          conversationMessages.set(msg.conversation_id, { received: [], sent: [] });
        }
        const convMsgs = conversationMessages.get(msg.conversation_id)!;
        if (msg.is_from_contact) {
          convMsgs.received.push(new Date(msg.created_at));
        } else {
          convMsgs.sent.push(new Date(msg.created_at));
        }
      });

      // Calculate average response time per channel
      const channelResponseTimes = new Map<ChannelType, number[]>();
      channels.forEach(ch => channelResponseTimes.set(ch, []));

      conversationMessages.forEach((convMsgs) => {
        // Sort messages by time
        const received = convMsgs.received.sort((a, b) => a.getTime() - b.getTime());
        const sent = convMsgs.sent.sort((a, b) => a.getTime() - b.getTime());

        // Match each received message to the next sent message
        received.forEach(receivedTime => {
          const nextSent = sent.find(s => s.getTime() > receivedTime.getTime());
          if (nextSent) {
            const responseTime = nextSent.getTime() - receivedTime.getTime();
            // Find which channel this conversation belongs to
            const conv = conversations?.find(c => {
              const convMsgsForConv = messages?.filter(m => m.conversation_id === c.id);
              return convMsgsForConv?.some(m => new Date(m.created_at).getTime() === receivedTime.getTime());
            });
            if (conv) {
              const channel = (conv.channel as ChannelType) || 'whatsapp';
              channelResponseTimes.get(channel)!.push(responseTime);
            }
          }
        });
      });

      // Set average response times
      channelResponseTimes.forEach((times, channel) => {
        if (times.length > 0) {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          channelMap.get(channel)!.avgResponseTimeMs = avg;
        }
      });

      // Calculate overall metrics
      const byChannel = Array.from(channelMap.values()).filter(m => m.totalConversations > 0 || m.totalMessages > 0);
      
      const overall: OverallMetrics = {
        totalConversations: byChannel.reduce((sum, m) => sum + m.totalConversations, 0),
        totalMessages: byChannel.reduce((sum, m) => sum + m.totalMessages, 0),
        messagesReceived: byChannel.reduce((sum, m) => sum + m.messagesReceived, 0),
        messagesSent: byChannel.reduce((sum, m) => sum + m.messagesSent, 0),
        aiResponses: byChannel.reduce((sum, m) => sum + m.aiResponses, 0),
        unreadCount: byChannel.reduce((sum, m) => sum + m.unreadCount, 0),
        byChannel,
      };

      setMetrics(overall);
    } catch (error) {
      console.error('Error fetching channel analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    dateRange,
    setDateRange,
    refetch: fetchMetrics,
  };
}
