import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Flag } from "lucide-react";
import { AppStoreReview } from "@/hooks/useAppStoreReviews";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReviewsListProps {
  reviews: AppStoreReview[];
  isLoading: boolean;
  showAll?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewsList({ reviews, isLoading, showAll = false }: ReviewsListProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 p-6">
        <Skeleton className="h-4 w-40 bg-white/10 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full bg-white/10" />
          ))}
        </div>
      </Card>
    );
  }

  const displayReviews = showAll ? reviews : reviews.slice(0, 5);

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {showAll ? 'Todas as Avaliações' : 'Avaliações Recentes'}
        </h3>
        <Badge variant="secondary" className="bg-white/10 text-white">
          {reviews.length} avaliações
        </Badge>
      </div>
      
      {displayReviews.length === 0 ? (
        <div className="py-8 text-center text-white/50">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma avaliação encontrada</p>
          <p className="text-sm">Sincronize com a App Store para ver as avaliações</p>
        </div>
      ) : (
        <div className={`space-y-4 ${showAll ? 'max-h-[600px] overflow-y-auto pr-2' : ''}`}>
          {displayReviews.map((review) => (
            <div 
              key={review.id} 
              className={`p-4 rounded-lg border ${
                (review.rating || 0) <= 2 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating || 0} />
                  {(review.rating || 0) <= 2 && (
                    <Badge variant="destructive" className="text-xs">
                      <Flag className="w-3 h-3 mr-1" />
                      Atenção
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-white/50">
                  {review.review_date 
                    ? format(parseISO(review.review_date), "dd/MM/yyyy", { locale: ptBR })
                    : '-'}
                </span>
              </div>
              
              {review.title && (
                <h4 className="font-medium text-white mb-1">{review.title}</h4>
              )}
              
              {review.body && (
                <p className="text-white/70 text-sm line-clamp-3">{review.body}</p>
              )}
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-white/50">
                  {review.author_name || 'Anônimo'} • {review.country_code || '-'}
                </span>
                {review.responded && (
                  <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                    Respondido
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
