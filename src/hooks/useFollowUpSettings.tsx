import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { FollowUpSettings } from '@/types/notifications';

export function useFollowUpSettings() {
  const [settings, setSettings] = useState<FollowUpSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('follow_up_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setSettings(data as FollowUpSettings | null);
    } catch (error) {
      console.error('Error fetching follow-up settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveSettings = useCallback(async (newSettings: Partial<FollowUpSettings>) => {
    if (!user) return;

    try {
      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('follow_up_settings')
          .update({
            days_without_interaction: newSettings.days_without_interaction,
            notify_in_app: newSettings.notify_in_app,
            notify_whatsapp: newSettings.notify_whatsapp,
            manychat_subscriber_id: newSettings.manychat_subscriber_id,
          })
          .eq('id', settings.id);

        if (error) throw error;

        setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('follow_up_settings')
          .insert({
            user_id: user.id,
            days_without_interaction: newSettings.days_without_interaction ?? 7,
            notify_in_app: newSettings.notify_in_app ?? true,
            notify_whatsapp: newSettings.notify_whatsapp ?? true,
            manychat_subscriber_id: newSettings.manychat_subscriber_id ?? null,
          })
          .select()
          .single();

        if (error) throw error;

        setSettings(data as FollowUpSettings);
      }

      toast({
        title: 'Configurações salvas',
        description: 'Suas configurações de follow-up foram atualizadas.',
      });
    } catch (error) {
      console.error('Error saving follow-up settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    }
  }, [user, settings, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    saveSettings,
    refetch: fetchSettings,
  };
}