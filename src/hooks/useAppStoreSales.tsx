import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppStoreSale {
  id: string;
  date: string;
  units: number;
  proceeds: number;
  country_code: string | null;
  product_type: string | null;
  product_name: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export function useAppStoreSales() {
  const { data: sales, isLoading, error, refetch } = useQuery({
    queryKey: ['appstore-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appstore_sales')
        .select('*')
        .order('date', { ascending: false })
        .limit(365);
      
      if (error) throw error;
      return data as AppStoreSale[];
    },
  });

  const totalRevenue = sales?.reduce((acc, sale) => acc + (sale.proceeds || 0), 0) || 0;
  const totalUnits = sales?.reduce((acc, sale) => acc + (sale.units || 0), 0) || 0;

  return {
    sales,
    isLoading,
    error,
    refetch,
    totalRevenue,
    totalUnits,
  };
}
