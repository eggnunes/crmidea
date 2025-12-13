import { Lead, PRODUCTS, STATUSES } from '@/types/crm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardChartsProps {
  leads: Lead[];
}

const COLORS = {
  consultoria: 'hsl(280, 70%, 55%)',
  mentoria: 'hsl(217, 91%, 60%)',
  curso: 'hsl(142, 76%, 45%)',
  ebook: 'hsl(45, 93%, 58%)',
  primary: 'hsl(217, 91%, 60%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  destructive: 'hsl(0, 84%, 60%)',
  muted: 'hsl(215, 20%, 55%)'
};

export function DashboardCharts({ leads }: DashboardChartsProps) {
  // Calculate data for sales by period (last 6 months)
  const now = new Date();
  const sixMonthsAgo = subMonths(now, 5);
  const months = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: endOfMonth(now) });

  const salesByMonth = months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthLeads = leads.filter(lead => {
      const leadDate = parseISO(lead.createdAt);
      return leadDate >= monthStart && leadDate <= monthEnd;
    });

    const wonLeads = monthLeads.filter(l => l.status === 'fechado-ganho');
    const lostLeads = monthLeads.filter(l => l.status === 'fechado-perdido');

    return {
      month: format(month, 'MMM', { locale: ptBR }),
      leads: monthLeads.length,
      ganhos: wonLeads.length,
      perdidos: lostLeads.length,
      receita: wonLeads.reduce((acc, l) => acc + l.value, 0)
    };
  });

  // Calculate lead sources
  const sourceStats = leads.reduce((acc, lead) => {
    const source = lead.source || 'Não informado';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceData = Object.entries(sourceStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Calculate conversion rate by product
  const productConversion = PRODUCTS.map(product => {
    const productLeads = leads.filter(l => l.product === product.id);
    const won = productLeads.filter(l => l.status === 'fechado-ganho').length;
    const closed = productLeads.filter(l => ['fechado-ganho', 'fechado-perdido'].includes(l.status)).length;
    const conversionRate = closed > 0 ? Math.round((won / closed) * 100) : 0;

    return {
      name: product.shortName,
      leads: productLeads.length,
      conversao: conversionRate,
      receita: productLeads.filter(l => l.status === 'fechado-ganho').reduce((acc, l) => acc + l.value, 0)
    };
  }).filter(p => p.leads > 0);

  // Status distribution
  const statusDistribution = STATUSES.map(status => ({
    name: status.name,
    value: leads.filter(l => l.status === status.id).length,
    color: status.color
  })).filter(s => s.value > 0);

  const pieColors = [
    COLORS.primary,
    COLORS.mentoria,
    COLORS.success,
    COLORS.warning,
    COLORS.consultoria,
    COLORS.destructive
  ];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' && entry.name.includes('Receita') 
                ? `R$ ${entry.value.toLocaleString('pt-BR')}`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (leads.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-border/50 col-span-full">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Cadastre alguns leads para visualizar os gráficos e relatórios
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales by Period */}
      <Card className="glass border-border/50 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Leads e Receita por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByMonth}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)' }}
                  tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="leads" name="Total Leads" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="ganhos" name="Ganhos" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="receita" 
                  name="Receita (R$)"
                  stroke={COLORS.success} 
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Lead Sources */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Origem dos Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(222, 47%, 9%)', 
                    border: '1px solid hsl(222, 47%, 18%)',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  formatter={(value) => <span style={{ color: 'hsl(215, 20%, 55%)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rate by Product */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Taxa de Conversão por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productConversion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)' }}
                  width={80}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Conversão']}
                  contentStyle={{ 
                    background: 'hsl(222, 47%, 9%)', 
                    border: '1px solid hsl(222, 47%, 18%)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="conversao" fill={COLORS.consultoria} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(222, 47%, 9%)', 
                    border: '1px solid hsl(222, 47%, 18%)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" name="Leads" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Product */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Receita por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productConversion.filter(p => p.receita > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)' }}
                />
                <YAxis 
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)' }}
                  tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                  contentStyle={{ 
                    background: 'hsl(222, 47%, 9%)', 
                    border: '1px solid hsl(222, 47%, 18%)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="receita" name="Receita" fill={COLORS.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
