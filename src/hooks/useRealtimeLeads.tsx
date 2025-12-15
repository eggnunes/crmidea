import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export function useRealtimeLeads(onNewLead?: (lead: any) => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const notificationPermissionRef = useRef<NotificationPermission>('default');

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      notificationPermissionRef.current = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      notificationPermissionRef.current = permission;
      return permission === 'granted';
    }

    return false;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string, icon?: string) => {
    if (notificationPermissionRef.current === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'new-lead',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Request permission on mount
    requestNotificationPermission();

    // Subscribe to new leads
    const channel = supabase
      .channel('realtime-leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New lead received:', payload);
          const newLead = payload.new;

          // Check if it's from Kiwify or Instagram
          const isKiwify = newLead.source === 'Kiwify';
          const isInstagram = newLead.source?.includes('Instagram');

          if (isKiwify || isInstagram) {
            const source = isKiwify ? 'Kiwify' : 'Instagram';
            const emoji = isKiwify ? '🛒' : '📸';

            // Show toast notification
            toast({
              title: `${emoji} Novo lead via ${source}!`,
              description: `${newLead.name} - ${newLead.product}`,
            });

            // Show browser notification
            showBrowserNotification(
              `${emoji} Novo Lead - ${source}`,
              `${newLead.name} demonstrou interesse em ${newLead.product}`
            );
          }

          // Call the callback if provided
          onNewLead?.(newLead);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, showBrowserNotification, requestNotificationPermission, onNewLead]);

  return {
    requestNotificationPermission,
    notificationPermission: notificationPermissionRef.current,
  };
}
