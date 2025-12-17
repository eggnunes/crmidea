import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRODUCTS } from "@/types/crm";
import { Lead } from "@/types/crm";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface MonthlySalesReportProps {
  leads: Lead[];
}

export function MonthlySalesReport({ leads }: MonthlySalesReportProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  
  // Generate last 12 months options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: i,
      label: format(date, "MMMM yyyy", { locale: ptBR }),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  const currentPeriod = monthOptions[selectedMonth];
  const previousPeriod = monthOptions[Math.min(selectedMonth + 1, 11)];

  // Filter leads for the selected month (won deals only)
  const getMonthSales = (start: Date, end: Date) => {
    return leads.filter(lead => {
      if (lead.status !== 'fechado-ganho') return false;
      const leadDate = new Date(lead.updatedAt);
      return isWithinInterval(leadDate, { start, end });
    });
  };

  const currentSales = getMonthSales(currentPeriod.start, currentPeriod.end);
  const previousSales = getMonthSales(previousPeriod.start, previousPeriod.end);

  // Calculate totals
  const currentTotal = currentSales.reduce((acc, lead) => acc + lead.value, 0);
  const previousTotal = previousSales.reduce((acc, lead) => acc + lead.value, 0);
  const percentChange = previousTotal > 0 
    ? ((currentTotal - previousTotal) / previousTotal) * 100 
    : currentTotal > 0 ? 100 : 0;

  // Sales by product for current month
  const salesByProduct = PRODUCTS.map(product => {
    const productSales = currentSales.filter(lead => lead.product === product.id);
    const total = productSales.reduce((acc, lead) => acc + lead.value, 0);
    return {
      product,
      count: productSales.length,
      total,
    };
  }).filter(p => p.count > 0).sort((a, b) => b.total - a.total);

  // All leads created in this month (not just won)
  const newLeadsThisMonth = leads.filter(lead => {
    const leadDate = new Date(lead.createdAt);
    return isWithinInterval(leadDate, { start: currentPeriod.start, end: currentPeriod.end });
  });

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Relatório de Vendas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe suas vendas mês a mês
          </p>
        </div>
        <Select
          value={selectedMonth.toString()}
          onValueChange={(v) => setSelectedMonth(parseInt(v))}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Receita do Mês
                </p>
                <p className="text-2xl font-bold text-success mt-1">
                  R$ {currentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-success/10"
              )}>
                <DollarSign className="w-5 h-5 text-success" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {percentChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span className={cn(
                "text-xs font-medium",
                percentChange >= 0 ? "text-success" : "text-destructive"
              )}>
                {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Number of Sales */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Vendas Realizadas
                </p>
                <p className="text-2xl font-bold mt-1">{currentSales.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {previousSales.length} no mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Average Ticket */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Ticket Médio
                </p>
                <p className="text-2xl font-bold mt-1">
                  R$ {currentSales.length > 0 
                    ? (currentTotal / currentSales.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
                    : '0,00'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Leads */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Novos Leads
                </p>
                <p className="text-2xl font-bold mt-1">{newLeadsThisMonth.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-info/10">
                <Calendar className="w-5 h-5 text-info" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              entraram no funil este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Product */}
      {salesByProduct.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vendas por Produto</CardTitle>
            <CardDescription>
              Detalhamento das vendas de {currentPeriod.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesByProduct.map(({ product, count, total }) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        product.color === 'consultoria' && "bg-consultoria/20 text-consultoria",
                        product.color === 'mentoria' && "bg-mentoria/20 text-mentoria",
                        product.color === 'curso' && "bg-curso/20 text-curso",
                        product.color === 'ebook' && "bg-ebook/20 text-ebook"
                      )}
                    >
                      {count}x
                    </Badge>
                    <span className="font-medium">{product.shortName}</span>
                  </div>
                  <span className="font-bold text-success">
                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {salesByProduct.length === 0 && (
        <Card className="glass border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma venda registrada em {currentPeriod.label}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
