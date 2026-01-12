import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppStoreReview {
  id: string;
  apple_id: string | null;
  rating: number | null;
  title: string | null;
  body: string | null;
  author_name: string | null;
  country_code: string | null;
  review_date: string | null;
  responded: boolean;
  response_text: string | null;
  created_at: string;
}

export function useAppStoreReviews() {
  const { data: reviews, isLoading, error, refetch } = useQuery({
    queryKey: ['appstore-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appstore_reviews')
        .select('*')
        .order('review_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as AppStoreReview[];
    },
  });

  const averageRating = reviews?.length 
    ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length 
    : 0;

  const ratingCounts = {
    5: reviews?.filter(r => r.rating === 5).length || 0,
    4: reviews?.filter(r => r.rating === 4).length || 0,
    3: reviews?.filter(r => r.rating === 3).length || 0,
    2: reviews?.filter(r => r.rating === 2).length || 0,
    1: reviews?.filter(r => r.rating === 1).length || 0,
  };

  return {
    reviews,
    isLoading,
    error,
    refetch,
    averageRating,
    ratingCounts,
    totalReviews: reviews?.length || 0,
  };
}
