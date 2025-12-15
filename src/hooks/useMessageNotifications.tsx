import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

type ChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'email' | 'telegram';

const CHANNEL_NAMES: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  email: 'Email',
  telegram: 'Telegram',
};

export function useMessageNotifications() {
  const { user } = useAuth();
  const notificationPermission = useRef<NotificationPermission>('default');

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    notificationPermission.current = permission;
    return permission;
  }, []);

  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    // Show toast notification
    toast(title, {
      description: body,
      duration: 5000,
    });

    // Show browser push notification
    if (notificationPermission.current === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          tag: 'new-message',
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const message = payload.new as {
            id: string;
            conversation_id: string;
            content: string;
            is_from_contact: boolean;
            channel: ChannelType;
          };

          // Only notify for incoming messages from contacts
          if (!message.is_from_contact) return;

          // Fetch conversation details
          const { data: conversation } = await supabase
            .from('whatsapp_conversations')
            .select('contact_name, contact_phone, channel')
            .eq('id', message.conversation_id)
            .single();

          if (conversation) {
            const channelName = CHANNEL_NAMES[message.channel || 'whatsapp'];
            const contactName = conversation.contact_name || conversation.contact_phone;
            const content = message.content.length > 100 
              ? message.content.substring(0, 100) + '...' 
              : message.content;

            showNotification(
              `Nova mensagem via ${channelName}`,
              `${contactName}: ${content}`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showNotification]);

  return {
    requestPermission,
    showNotification,
    hasPermission: notificationPermission.current === 'granted',
  };
}
