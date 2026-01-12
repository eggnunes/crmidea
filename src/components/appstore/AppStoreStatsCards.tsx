import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, DollarSign, Star, Smartphone, TrendingUp, TrendingDown } from "lucide-react";
import { AppStoreSale } from "@/hooks/useAppStoreSales";
import { AppStoreReview } from "@/hooks/useAppStoreReviews";
import { AppStoreMetric } from "@/hooks/useAppStoreMetrics";

interface AppStoreStatsCardsProps {
  sales: AppStoreSale[] | undefined;
  reviews: AppStoreReview[] | undefined;
  metrics: AppStoreMetric[] | undefined;
  isLoading: boolean;
}

export function AppStoreStatsCards({ sales, reviews, metrics, isLoading }: AppStoreStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white/5 border-white/10 p-6">
            <Skeleton className="h-4 w-24 bg-white/10 mb-2" />
            <Skeleton className="h-8 w-32 bg-white/10" />
          </Card>
        ))}
      </div>
    );
  }

  const totalDownloads = metrics?.reduce((acc, m) => acc + (m.downloads || 0), 0) || 0;
  const totalRevenue = sales?.reduce((acc, s) => acc + (s.proceeds || 0), 0) || 0;
  const averageRating = reviews?.length 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';
  const activeDevices = metrics?.[0]?.active_devices || 0;

  // Calculate trends (last 30 days vs previous 30 days)
  const last30Days = metrics?.slice(0, 30) || [];
  const prev30Days = metrics?.slice(30, 60) || [];
  
  const recentDownloads = last30Days.reduce((acc, m) => acc + (m.downloads || 0), 0);
  const previousDownloads = prev30Days.reduce((acc, m) => acc + (m.downloads || 0), 0);
  const downloadsTrend = previousDownloads > 0 
    ? ((recentDownloads - previousDownloads) / previousDownloads * 100).toFixed(1)
    : '0';

  const stats = [
    {
      title: "Downloads Totais",
      value: totalDownloads.toLocaleString(),
      icon: Download,
      trend: downloadsTrend,
      trendUp: Number(downloadsTrend) >= 0,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "Receita Total",
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      trend: null,
      trendUp: true,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      title: "Avaliação Média",
      value: averageRating,
      icon: Star,
      subtitle: `${reviews?.length || 0} avaliações`,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    },
    {
      title: "Dispositivos Ativos",
      value: activeDevices.toLocaleString(),
      icon: Smartphone,
      trend: null,
      trendUp: true,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm">{stat.title}</span>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-white/50 mt-1">{stat.subtitle}</p>
              )}
            </div>
            {stat.trend !== null && stat.trend !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${stat.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                {stat.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(Number(stat.trend))}%</span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
