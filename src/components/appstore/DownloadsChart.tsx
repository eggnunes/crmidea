import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AppStoreMetric } from "@/hooks/useAppStoreMetrics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DownloadsChartProps {
  metrics: AppStoreMetric[] | undefined;
  isLoading: boolean;
}

export function DownloadsChart({ metrics, isLoading }: DownloadsChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 p-6">
        <Skeleton className="h-4 w-40 bg-white/10 mb-4" />
        <Skeleton className="h-64 w-full bg-white/10" />
      </Card>
    );
  }

  const chartData = [...(metrics || [])]
    .reverse()
    .slice(-30)
    .map((m) => ({
      date: format(parseISO(m.date), "dd/MM", { locale: ptBR }),
      downloads: m.downloads || 0,
      redownloads: m.redownloads || 0,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white/60 text-xs mb-1">{label}</p>
          <p className="text-white font-semibold">
            {payload[0].value.toLocaleString()} downloads
          </p>
          {payload[1] && (
            <p className="text-white/70 text-sm">
              {payload[1].value.toLocaleString()} reinstalações
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Downloads (últimos 30 dias)</h3>
      
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-white/50">
          Nenhum dado disponível. Sincronize com a App Store.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="downloads"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#downloadGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
