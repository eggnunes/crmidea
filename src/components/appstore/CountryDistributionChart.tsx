import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AppStoreSale } from "@/hooks/useAppStoreSales";
import { useMemo } from "react";

interface CountryDistributionChartProps {
  sales: AppStoreSale[] | undefined;
  isLoading: boolean;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

const COUNTRY_NAMES: Record<string, string> = {
  US: 'Estados Unidos',
  BR: 'Brasil',
  GB: 'Reino Unido',
  DE: 'Alemanha',
  FR: 'França',
  CA: 'Canadá',
  AU: 'Austrália',
  JP: 'Japão',
  MX: 'México',
  ES: 'Espanha',
  IT: 'Itália',
  PT: 'Portugal',
};

export function CountryDistributionChart({ sales, isLoading }: CountryDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!sales?.length) return [];

    // Group by country
    const countryData: Record<string, number> = {};
    sales.forEach((sale) => {
      const country = sale.country_code || 'Other';
      countryData[country] = (countryData[country] || 0) + (sale.units || 0);
    });

    // Sort and take top 5 + others
    const sorted = Object.entries(countryData)
      .sort(([, a], [, b]) => b - a);
    
    const top5 = sorted.slice(0, 5);
    const othersTotal = sorted.slice(5).reduce((acc, [, val]) => acc + val, 0);

    const result = top5.map(([code, value]) => ({
      name: COUNTRY_NAMES[code] || code,
      value,
      code,
    }));

    if (othersTotal > 0) {
      result.push({ name: 'Outros', value: othersTotal, code: 'OTHER' });
    }

    return result;
  }, [sales]);

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 p-6">
        <Skeleton className="h-4 w-40 bg-white/10 mb-4" />
        <Skeleton className="h-48 w-full bg-white/10" />
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-white/70">{data.value.toLocaleString()} downloads</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Downloads por País</h3>
      
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-white/50">
          Nenhum dado disponível
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="vertical" 
              align="right" 
              verticalAlign="middle"
              formatter={(value) => <span className="text-white/70 text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
