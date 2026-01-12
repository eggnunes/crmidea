import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { AppStoreReview } from "@/hooks/useAppStoreReviews";
import { useMemo } from "react";

interface RatingsDistributionProps {
  reviews: AppStoreReview[] | undefined;
  isLoading: boolean;
}

export function RatingsDistribution({ reviews, isLoading }: RatingsDistributionProps) {
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews?.forEach((r) => {
      if (r.rating && r.rating >= 1 && r.rating <= 5) {
        counts[r.rating as keyof typeof counts]++;
      }
    });
    return counts;
  }, [reviews]);

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const average = total > 0
    ? (
        Object.entries(distribution).reduce(
          (acc, [stars, count]) => acc + Number(stars) * count,
          0
        ) / total
      ).toFixed(1)
    : '0.0';

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 p-6">
        <Skeleton className="h-4 w-40 bg-white/10 mb-4" />
        <Skeleton className="h-32 w-full bg-white/10" />
      </Card>
    );
  }

  const getBarColor = (stars: number) => {
    if (stars >= 4) return 'bg-green-500';
    if (stars === 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Notas</h3>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl font-bold text-white">{average}</div>
        <div className="flex flex-col">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(Number(average)) 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-white/20'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-white/50 mt-1">{total} avaliações</span>
        </div>
      </div>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = distribution[stars as keyof typeof distribution];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-white/70 text-sm w-8">{stars}★</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${getBarColor(stars)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-white/50 text-xs w-10 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
