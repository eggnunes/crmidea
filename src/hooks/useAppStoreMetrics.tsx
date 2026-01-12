import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppStoreMetric {
  id: string;
  date: string;
  impressions: number;
  page_views: number;
  downloads: number;
  redownloads: number;
  sessions: number;
  active_devices: number;
  crashes: number;
  created_at: string;
  updated_at: string;
}

export function useAppStoreMetrics() {
  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['appstore-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appstore_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(90);
      
      if (error) throw error;
      return data as AppStoreMetric[];
    },
  });

  const totalDownloads = metrics?.reduce((acc, m) => acc + (m.downloads || 0), 0) || 0;
  const totalSessions = metrics?.reduce((acc, m) => acc + (m.sessions || 0), 0) || 0;
  const latestActiveDevices = metrics?.[0]?.active_devices || 0;

  return {
    metrics,
    isLoading,
    error,
    refetch,
    totalDownloads,
    totalSessions,
    latestActiveDevices,
  };
}
