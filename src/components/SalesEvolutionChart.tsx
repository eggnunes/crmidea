import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PRODUCTS } from "@/types/crm";
import { Lead } from "@/types/crm";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  ComposedChart
} from "recharts";
import { TrendingUp } from "lucide-react";

interface SalesEvolutionChartProps {
  leads: Lead[];
}

// Product colors for the chart
const PRODUCT_COLORS: Record<string, string> = {
  'consultoria': 'hsl(var(--consultoria))',
  'mentoria-coletiva': 'hsl(var(--mentoria))',
  'mentoria-individual': 'hsl(var(--mentoria))',
  'curso-idea': 'hsl(var(--curso))',
  'guia-ia': 'hsl(var(--ebook))',
  'codigo-prompts': 'hsl(var(--ebook))',
  'combo-ebooks': 'hsl(var(--ebook))',
};

// Fallback colors if CSS variables aren't available
const FALLBACK_COLORS: Record<string, string> = {
  'consultoria': '#f59e0b',
  'mentoria-coletiva': '#8b5cf6',
  'mentoria-individual': '#a78bfa',
  'curso-idea': '#22c55e',
  'guia-ia': '#3b82f6',
  'codigo-prompts': '#60a5fa',
  'combo-ebooks': '#93c5fd',
};

export function SalesEvolutionChart({ leads }: SalesEvolutionChartProps) {
  // Generate last 6 months data
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i); // Start from 5 months ago
    return {
      month: format(date, "MMM", { locale: ptBR }),
      fullMonth: format(date, "MMMM yyyy", { locale: ptBR }),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  // Calculate sales data for each month and product
  const chartData = months.map(month => {
    const monthData: Record<string, number | string> = {
      month: month.month,
      fullMonth: month.fullMonth,
      total: 0,
    };

    // Get won leads for this month
    const wonLeads = leads.filter(lead => {
      if (lead.status !== 'fechado-ganho') return false;
      const leadDate = new Date(lead.updatedAt);
      return isWithinInterval(leadDate, { start: month.start, end: month.end });
    });

    // Calculate total and per-product values
    let total = 0;
    
    PRODUCTS.forEach(product => {
      const productSales = wonLeads
        .filter(lead => lead.product === product.id)
        .reduce((acc, lead) => acc + lead.value, 0);
      
      monthData[product.id] = productSales;
      total += productSales;
    });

    monthData.total = total;
    return monthData;
  });

  // Check if there's any data
  const hasData = chartData.some(d => (d.total as number) > 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data?.fullMonth}</p>
          {payload
            .filter((entry: any) => entry.value > 0)
            .sort((a: any, b: any) => b.value - a.value)
            .map((entry: any, index: number) => {
              const product = PRODUCTS.find(p => p.id === entry.dataKey);
              return (
                <div key={index} className="flex justify-between gap-4 text-sm">
                  <span style={{ color: entry.color }}>
                    {product?.shortName || entry.dataKey}:
                  </span>
                  <span className="font-medium">
                    R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}
          <div className="border-t border-border mt-2 pt-2 flex justify-between gap-4 text-sm font-bold">
            <span>Total:</span>
            <span className="text-success">
              R$ {(data?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get active products (those with at least some sales)
  const activeProducts = PRODUCTS.filter(product => 
    chartData.some(d => (d[product.id] as number) > 0)
  );

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Evolução de Vendas - Últimos 6 Meses
        </CardTitle>
        <CardDescription>
          Receita mensal por produto com linhas de tendência
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma venda registrada nos últimos 6 meses</p>
              <p className="text-sm mt-1">Importe seus dados históricos da Kiwify para visualizar</p>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => {
                    const product = PRODUCTS.find(p => p.id === value);
                    return <span className="text-xs">{product?.shortName || value}</span>;
                  }}
                />
                
                {/* Area for total revenue */}
                <Area
                  type="monotone"
                  dataKey="total"
                  fill="hsl(var(--primary) / 0.1)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Total"
                  dot={false}
                />

                {/* Lines for each active product */}
                {activeProducts.map((product, index) => (
                  <Line
                    key={product.id}
                    type="monotone"
                    dataKey={product.id}
                    stroke={FALLBACK_COLORS[product.id]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: FALLBACK_COLORS[product.id] }}
                    activeDot={{ r: 6 }}
                    name={product.id}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
