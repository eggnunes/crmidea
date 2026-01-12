import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AppStoreSale } from "@/hooks/useAppStoreSales";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

interface RevenueChartProps {
  sales: AppStoreSale[] | undefined;
  isLoading: boolean;
}

export function RevenueChart({ sales, isLoading }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!sales?.length) return [];

    // Group sales by month
    const monthlyData: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = startOfMonth(subMonths(now, i));
      const monthKey = format(monthDate, 'yyyy-MM');
      monthlyData[monthKey] = 0;
    }

    // Aggregate sales
    sales.forEach((sale) => {
      const monthKey = format(parseISO(sale.date), 'yyyy-MM');
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += sale.proceeds || 0;
      }
    });

    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month: format(parseISO(`${month}-01`), 'MMM', { locale: ptBR }),
      revenue: Number(revenue.toFixed(2)),
    }));
  }, [sales]);

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 p-6">
        <Skeleton className="h-4 w-40 bg-white/10 mb-4" />
        <Skeleton className="h-64 w-full bg-white/10" />
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white/60 text-xs mb-1 capitalize">{label}</p>
          <p className="text-green-400 font-semibold">
            ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Receita Mensal</h3>
      
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-white/50">
          Nenhum dado disponível. Sincronize com a App Store.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="revenue" 
              fill="#22c55e" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
