import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Users, Repeat, XCircle } from "lucide-react";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  id: string;
  status: string;
  product_id: string | null;
  expires_date: string | null;
  purchase_date: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionMetricsProps {
  subscriptions: Subscription[] | undefined;
  isLoading: boolean;
}

interface MetricCard {
  title: string;
  value: string;
  subvalue?: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
}

// Average price per subscription (estimate - adjust based on your actual pricing)
const AVG_SUBSCRIPTION_PRICE = 9.99;

export function SubscriptionMetrics({ subscriptions, isLoading }: SubscriptionMetricsProps) {
  const metrics = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) {
      return {
        activeSubscriptions: 0,
        mrr: 0,
        arr: 0,
        churnRate: 0,
        newThisMonth: 0,
        cancelledThisMonth: 0,
        mrrHistory: [],
        churnHistory: [],
      };
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Active subscriptions
    const activeSubscriptions = subscriptions.filter(
      s => s.status === 'active' || s.status === 'resubscribed'
    ).length;

    // Subscriptions that became active this month
    const newThisMonth = subscriptions.filter(s => {
      if (!s.purchase_date) return false;
      const purchaseDate = parseISO(s.purchase_date);
      return isWithinInterval(purchaseDate, { start: thisMonthStart, end: thisMonthEnd });
    }).length;

    // Cancelled/expired this month
    const cancelledThisMonth = subscriptions.filter(s => {
      if (s.status !== 'expired' && s.status !== 'cancelled' && s.status !== 'refunded') return false;
      const updatedDate = parseISO(s.updated_at);
      return isWithinInterval(updatedDate, { start: thisMonthStart, end: thisMonthEnd });
    }).length;

    // Active last month (for churn calculation)
    const activeLastMonth = subscriptions.filter(s => {
      const createdDate = parseISO(s.created_at);
      return createdDate <= lastMonthEnd && 
        (s.status === 'active' || s.status === 'resubscribed' || 
         (s.expires_date && parseISO(s.expires_date) > lastMonthEnd));
    }).length;

    // Calculate MRR
    const mrr = activeSubscriptions * AVG_SUBSCRIPTION_PRICE;
    const arr = mrr * 12;

    // Calculate churn rate
    const churnRate = activeLastMonth > 0 
      ? (cancelledThisMonth / activeLastMonth) * 100 
      : 0;

    // Generate MRR history for the last 6 months
    const mrrHistory = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthEnd = endOfMonth(monthDate);
      
      const activeInMonth = subscriptions.filter(s => {
        const createdDate = parseISO(s.created_at);
        if (createdDate > monthEnd) return false;
        
        if (s.status === 'active' || s.status === 'resubscribed') return true;
        if (s.expires_date && parseISO(s.expires_date) > monthEnd) return true;
        
        return false;
      }).length;

      mrrHistory.push({
        month: format(monthDate, 'MMM', { locale: ptBR }),
        mrr: activeInMonth * AVG_SUBSCRIPTION_PRICE,
        subscribers: activeInMonth,
      });
    }

    // Generate churn history for the last 6 months
    const churnHistory = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const prevMonthEnd = endOfMonth(subMonths(monthDate, 1));
      
      const churned = subscriptions.filter(s => {
        if (s.status !== 'expired' && s.status !== 'cancelled' && s.status !== 'refunded') return false;
        const updatedDate = parseISO(s.updated_at);
        return isWithinInterval(updatedDate, { start: monthStart, end: monthEnd });
      }).length;

      const activeAtStart = subscriptions.filter(s => {
        const createdDate = parseISO(s.created_at);
        return createdDate <= prevMonthEnd && 
          (s.status === 'active' || s.status === 'resubscribed' || 
           (s.expires_date && parseISO(s.expires_date) > prevMonthEnd));
      }).length;

      const rate = activeAtStart > 0 ? (churned / activeAtStart) * 100 : 0;

      churnHistory.push({
        month: format(monthDate, 'MMM', { locale: ptBR }),
        churnRate: Number(rate.toFixed(1)),
        churned,
      });
    }

    return {
      activeSubscriptions,
      mrr,
      arr,
      churnRate,
      newThisMonth,
      cancelledThisMonth,
      mrrHistory,
      churnHistory,
    };
  }, [subscriptions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white/5 border-white/10 p-6">
              <Skeleton className="h-4 w-20 bg-white/10 mb-2" />
              <Skeleton className="h-8 w-32 bg-white/10" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const cards: MetricCard[] = [
    {
      title: "MRR",
      value: `$${metrics.mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subvalue: `${metrics.activeSubscriptions} assinantes ativos`,
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      title: "ARR",
      value: `$${metrics.arr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subvalue: "Receita Anual Recorrente",
      icon: TrendingUp,
      color: "text-blue-400",
    },
    {
      title: "Taxa de Churn",
      value: `${metrics.churnRate.toFixed(1)}%`,
      subvalue: `${metrics.cancelledThisMonth} cancelamentos este mês`,
      icon: metrics.churnRate > 5 ? TrendingDown : TrendingUp,
      color: metrics.churnRate > 5 ? "text-red-400" : "text-green-400",
    },
    {
      title: "Novos Este Mês",
      value: metrics.newThisMonth.toString(),
      subvalue: "Novas assinaturas",
      icon: Users,
      color: "text-purple-400",
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/10 rounded-lg p-3">
          <p className="text-white font-medium">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-white/70 text-sm">
              {p.name}: {p.name === 'MRR' ? `$${p.value.toFixed(2)}` : 
                        p.name === 'Churn' ? `${p.value}%` : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-white/5 border-white/10 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">{card.title}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            {card.subvalue && (
              <div className="text-xs text-white/50 mt-1">{card.subvalue}</div>
            )}
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Evolution Chart */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Evolução do MRR</h3>
          {metrics.mrrHistory.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-white/50">
              Sem dados disponíveis
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.mrrHistory}>
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
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="mrr" 
                  name="MRR"
                  fill="rgb(34, 197, 94)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Churn Rate Chart */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Taxa de Churn Mensal</h3>
          {metrics.churnHistory.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-white/50">
              Sem dados disponíveis
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.churnHistory}>
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
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="churnRate" 
                  name="Churn"
                  stroke="rgb(239, 68, 68)" 
                  strokeWidth={2}
                  dot={{ fill: 'rgb(239, 68, 68)', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Subscription Status Breakdown */}
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Status das Assinaturas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { status: 'active', label: 'Ativas', color: 'bg-green-500' },
            { status: 'expired', label: 'Expiradas', color: 'bg-red-500' },
            { status: 'grace_period', label: 'Período de Graça', color: 'bg-yellow-500' },
            { status: 'billing_retry', label: 'Tentando Cobrança', color: 'bg-orange-500' },
            { status: 'refunded', label: 'Reembolsadas', color: 'bg-purple-500' },
            { status: 'will_expire', label: 'Cancelamento Agendado', color: 'bg-gray-500' },
          ].map(({ status, label, color }) => {
            const count = subscriptions?.filter(s => s.status === status).length || 0;
            return (
              <div key={status} className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-white/60 text-xs">{label}</span>
                </div>
                <div className="text-xl font-bold text-white">{count}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
