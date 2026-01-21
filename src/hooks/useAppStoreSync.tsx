import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number;
  error_message: string | null;
  created_at: string;
}

export function useAppStoreSync() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: syncLogs } = useQuery({
    queryKey: ['appstore-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appstore_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as SyncLog[];
    },
  });

  const lastSync = syncLogs?.[0]?.created_at;

  const syncAll = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('appstore-connect', {
        body: { action: 'sync-all' }
      });

      if (error) throw error;

      // Show appropriate message based on response
      if (data?.sales_status?.errors === 30 && data?.sales_status?.available === 0) {
        toast.info(data.message || 'Nenhum relatório de vendas disponível ainda. A Apple pode demorar 24-72h para processar dados de apps novos.', {
          duration: 8000,
        });
      } else if (data?.records_synced > 0) {
        toast.success(`Sincronizados ${data.records_synced} registros com sucesso!`);
      } else {
        toast.info(data?.message || 'Sincronização concluída. Nenhum dado novo encontrado.', {
          duration: 6000,
        });
      }
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['appstore-sales'] });
      queryClient.invalidateQueries({ queryKey: ['appstore-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['appstore-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['appstore-sync-logs'] });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.message || 'Erro ao sincronizar dados');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncSales = async () => {
    const { error } = await supabase.functions.invoke('appstore-connect', {
      body: { action: 'sync-sales' }
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['appstore-sales'] });
  };

  const syncReviews = async () => {
    const { error } = await supabase.functions.invoke('appstore-connect', {
      body: { action: 'sync-reviews' }
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['appstore-reviews'] });
  };

  const syncMetrics = async () => {
    const { error } = await supabase.functions.invoke('appstore-connect', {
      body: { action: 'sync-metrics' }
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['appstore-metrics'] });
  };

  return {
    syncAll,
    syncSales,
    syncReviews,
    syncMetrics,
    isSyncing,
    lastSync,
    syncLogs,
  };
}
