import { useMemo } from "react";
import { Lead } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MonthlyComparisonChartProps {
  leads: Lead[];
}

export function MonthlyComparisonChart({ leads }: MonthlyComparisonChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthLeads = leads.filter(lead => {
        const createdAt = new Date(lead.createdAt);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      });
      
      // Vendas (fechado_ganho)
      const sales = monthLeads.filter(l => l.status === 'fechado-ganho').length;
      
      // Reembolsos (leads com source contendo 'reembolso' ou 'refund')
      const refunds = monthLeads.filter(l => 
        l.source?.toLowerCase().includes('reembolso') || 
        l.source?.toLowerCase().includes('refund') ||
        l.notes?.toLowerCase().includes('reembolso') ||
        l.notes?.toLowerCase().includes('reembolsado')
      ).length;
      
      // Abandonos (leads com source contendo 'abandono' ou 'pix_gerado' ou 'boleto')
      const abandonments = monthLeads.filter(l => 
        l.source?.toLowerCase().includes('abandono') || 
        l.source?.toLowerCase().includes('pix_gerado') ||
        l.source?.toLowerCase().includes('boleto_gerado') ||
        l.source?.toLowerCase().includes('carrinho')
      ).length;
      
      months.push({
        month: format(monthDate, "MMM", { locale: ptBR }),
        fullMonth: format(monthDate, "MMMM/yyyy", { locale: ptBR }),
        vendas: sales,
        reembolsos: refunds,
        abandonos: abandonments
      });
    }
    
    return months;
  }, [leads]);

  const trends = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const current = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    
    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };
    
    return {
      vendas: calcTrend(current.vendas, previous.vendas),
      reembolsos: calcTrend(current.reembolsos, previous.reembolsos),
      abandonos: calcTrend(current.abandonos, previous.abandonos)
    };
  }, [chartData]);

  const TrendIndicator = ({ value, label, color, inverse = false }: { value: number; label: string; color: string; inverse?: boolean }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNeutral = value === 0;
    
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{label}:</span>
        <div className={`flex items-center gap-1 font-medium ${isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isNeutral ? (
            <Minus className="h-4 w-4" />
          ) : isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>{Math.abs(value).toFixed(0)}%</span>
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground capitalize mb-2">{data.fullMonth}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Vendas vs Reembolsos vs Abandonos</CardTitle>
        <p className="text-sm text-muted-foreground">Comparativo dos últimos 6 meses</p>
        {trends && (
          <div className="flex flex-wrap gap-4 pt-2 border-t border-border/30 mt-2">
            <TrendIndicator value={trends.vendas} label="Vendas" color="success" />
            <TrendIndicator value={trends.reembolsos} label="Reembolsos" color="destructive" inverse />
            <TrendIndicator value={trends.abandonos} label="Abandonos" color="warning" inverse />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="vendas" 
                name="Vendas"
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="reembolsos" 
                name="Reembolsos"
                stroke="hsl(var(--destructive))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="abandonos" 
                name="Abandonos"
                stroke="hsl(var(--warning))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
