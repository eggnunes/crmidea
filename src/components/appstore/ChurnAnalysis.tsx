import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Users, Calendar, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval, differenceInDays } from "date-fns";
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

interface WebhookEvent {
  id: string;
  notification_type: string;
  subtype: string | null;
  created_at: string;
}

interface ChurnAnalysisProps {
  subscriptions: Subscription[] | undefined;
  webhookEvents?: WebhookEvent[];
  isLoading: boolean;
}

const CHURN_REASONS = [
  { reason: 'price', label: 'Preço', color: '#ef4444' },
  { reason: 'not_using', label: 'Não usa mais', color: '#f97316' },
  { reason: 'billing_failed', label: 'Falha de cobrança', color: '#eab308' },
  { reason: 'refunded', label: 'Reembolso', color: '#8b5cf6' },
  { reason: 'expired', label: 'Expirado', color: '#6b7280' },
  { reason: 'revoked', label: 'Revogado', color: '#ec4899' },
];

export function ChurnAnalysis({ subscriptions, webhookEvents, isLoading }: ChurnAnalysisProps) {
  const analysis = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) {
      return {
        retentionData: [],
        churnReasons: [],
        avgLifetime: 0,
        atRiskCount: 0,
        cohortData: [],
      };
    }

    const now = new Date();

    // Calculate retention over 6 months
    const retentionData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Subscriptions active at start of month
      const activeAtStart = subscriptions.filter(s => {
        const createdDate = parseISO(s.created_at);
        if (createdDate >= monthStart) return false;
        
        if (s.status === 'active' || s.status === 'resubscribed') return true;
        if (s.expires_date && parseISO(s.expires_date) >= monthStart) return true;
        return false;
      }).length;

      // Subscriptions still active at end of month
      const activeAtEnd = subscriptions.filter(s => {
        const createdDate = parseISO(s.created_at);
        if (createdDate > monthEnd) return false;
        
        if (s.status === 'active' || s.status === 'resubscribed') return true;
        if (s.expires_date && parseISO(s.expires_date) >= monthEnd) return true;
        return false;
      }).length;

      const retentionRate = activeAtStart > 0 ? (activeAtEnd / activeAtStart) * 100 : 100;
      const churnRate = 100 - retentionRate;

      retentionData.push({
        month: format(monthDate, 'MMM', { locale: ptBR }),
        retention: Math.round(retentionRate),
        churn: Math.round(churnRate),
        active: activeAtEnd,
      });
    }

    // Calculate churn reasons based on status
    const churnReasons = CHURN_REASONS.map(reason => {
      let count = 0;
      
      switch (reason.reason) {
        case 'refunded':
          count = subscriptions.filter(s => s.status === 'refunded').length;
          break;
        case 'expired':
          count = subscriptions.filter(s => s.status === 'expired').length;
          break;
        case 'revoked':
          count = subscriptions.filter(s => s.status === 'revoked').length;
          break;
        case 'billing_failed':
          count = subscriptions.filter(s => 
            s.status === 'billing_retry' || s.status === 'grace_period'
          ).length;
          break;
        case 'not_using':
          count = subscriptions.filter(s => s.status === 'will_expire').length;
          break;
        default:
          count = 0;
      }

      return {
        name: reason.label,
        value: count,
        color: reason.color,
      };
    }).filter(r => r.value > 0);

    // Calculate average subscription lifetime
    const completedSubs = subscriptions.filter(s => 
      s.status !== 'active' && s.status !== 'resubscribed' && s.purchase_date
    );
    
    let totalDays = 0;
    completedSubs.forEach(s => {
      if (s.purchase_date) {
        const start = parseISO(s.purchase_date);
        const end = s.expires_date ? parseISO(s.expires_date) : parseISO(s.updated_at);
        totalDays += differenceInDays(end, start);
      }
    });
    
    const avgLifetime = completedSubs.length > 0 ? totalDays / completedSubs.length : 0;

    // Count at-risk subscriptions
    const atRiskCount = subscriptions.filter(s => 
      s.status === 'will_expire' || 
      s.status === 'billing_retry' || 
      s.status === 'grace_period'
    ).length;

    // Simple cohort data
    const cohortData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const cohort = subscriptions.filter(s => {
        if (!s.purchase_date) return false;
        const purchaseDate = parseISO(s.purchase_date);
        return isWithinInterval(purchaseDate, { start: monthStart, end: monthEnd });
      });

      const stillActive = cohort.filter(s => 
        s.status === 'active' || s.status === 'resubscribed'
      ).length;

      cohortData.push({
        month: format(monthDate, 'MMM/yy', { locale: ptBR }),
        cohortSize: cohort.length,
        stillActive,
        retention: cohort.length > 0 ? Math.round((stillActive / cohort.length) * 100) : 0,
      });
    }

    return {
      retentionData,
      churnReasons,
      avgLifetime: Math.round(avgLifetime),
      atRiskCount,
      cohortData,
    };
  }, [subscriptions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white/5 border-white/10 p-6">
              <Skeleton className="h-4 w-20 bg-white/10 mb-2" />
              <Skeleton className="h-8 w-32 bg-white/10" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/10 rounded-lg p-3">
          <p className="text-white font-medium">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-white/70 text-sm">
              {p.name}: {p.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Vida Média da Assinatura</span>
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analysis.avgLifetime} dias
          </div>
          <div className="text-xs text-white/50 mt-1">
            ~{Math.round(analysis.avgLifetime / 30)} meses
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Em Risco de Churn</span>
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analysis.atRiskCount}
          </div>
          <div className="text-xs text-white/50 mt-1">
            Assinaturas com problemas
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Retenção Atual</span>
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analysis.retentionData[analysis.retentionData.length - 1]?.retention || 0}%
          </div>
          <div className="text-xs text-white/50 mt-1">
            Este mês
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention Over Time */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Retenção vs Churn</h3>
          {analysis.retentionData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-white/50">
              Sem dados disponíveis
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analysis.retentionData}>
                <defs>
                  <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area 
                  type="monotone" 
                  dataKey="retention" 
                  name="Retenção"
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorRetention)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="churn" 
                  name="Churn"
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorChurn)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Churn Reasons */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Motivos de Churn</h3>
          {analysis.churnReasons.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-white/50">
              <div className="text-center">
                <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum churn registrado</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analysis.churnReasons}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analysis.churnReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend 
                  formatter={(value) => <span className="text-white/70 text-sm">{value}</span>}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Cohort Analysis Table */}
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Análise de Cohort</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Mês de Entrada</th>
                <th className="text-center py-3 px-4 text-white/60 text-sm font-medium">Tamanho do Cohort</th>
                <th className="text-center py-3 px-4 text-white/60 text-sm font-medium">Ainda Ativos</th>
                <th className="text-center py-3 px-4 text-white/60 text-sm font-medium">Retenção</th>
              </tr>
            </thead>
            <tbody>
              {analysis.cohortData.map((cohort, index) => (
                <tr key={index} className="border-b border-white/5">
                  <td className="py-3 px-4 text-white font-medium">{cohort.month}</td>
                  <td className="py-3 px-4 text-center text-white/70">{cohort.cohortSize}</td>
                  <td className="py-3 px-4 text-center text-white/70">{cohort.stillActive}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge 
                      className={`${
                        cohort.retention >= 80 ? 'bg-green-500/20 text-green-400' :
                        cohort.retention >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {cohort.retention}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
