import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type ChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'email' | 'telegram';

export interface ChannelConfig {
  id: string;
  user_id: string;
  channel: ChannelType;
  is_active: boolean;
  config: Record<string, any>;
  access_token?: string;
  page_id?: string;
  webhook_verify_token?: string;
  created_at: string;
  updated_at: string;
}

export function useChannelConfigs() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('channel_configs')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setConfigs((data || []) as ChannelConfig[]);
    } catch (error) {
      console.error('Error fetching channel configs:', error);
      toast.error('Erro ao carregar configurações de canais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [user]);

  const getChannelConfig = (channel: ChannelType): ChannelConfig | undefined => {
    return configs.find(c => c.channel === channel);
  };

  const saveChannelConfig = async (
    channel: ChannelType,
    data: Partial<Omit<ChannelConfig, 'id' | 'user_id' | 'channel' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return;

    try {
      const existingConfig = getChannelConfig(channel);

      if (existingConfig) {
        const { error } = await supabase
          .from('channel_configs')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('channel_configs')
          .insert({
            user_id: user.id,
            channel,
            ...data
          });

        if (error) throw error;
      }

      await fetchConfigs();
      toast.success('Configuração salva com sucesso');
    } catch (error) {
      console.error('Error saving channel config:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const toggleChannel = async (channel: ChannelType, isActive: boolean) => {
    await saveChannelConfig(channel, { is_active: isActive });
  };

  return {
    configs,
    loading,
    getChannelConfig,
    saveChannelConfig,
    toggleChannel,
    refetch: fetchConfigs
  };
}
