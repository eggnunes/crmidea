import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppStoreSubscription {
  id: string;
  original_transaction_id: string;
  product_id: string | null;
  bundle_id: string | null;
  status: string;
  expires_date: string | null;
  purchase_date: string | null;
  renewal_info: any;
  last_transaction_id: string | null;
  environment: string | null;
  app_account_token: string | null;
  user_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useAppStoreSubscriptions() {
  const { data: subscriptions, isLoading, refetch } = useQuery({
    queryKey: ['appstore-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appstore_subscriptions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
      }

      return data as AppStoreSubscription[];
    },
  });

  return {
    subscriptions,
    isLoading,
    refetch,
  };
}
