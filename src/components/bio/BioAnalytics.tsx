import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, MousePointerClick, TrendingUp, Calendar, RefreshCw } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClickData {
  link_title: string;
  link_url: string;
  category: string;
  click_count: number;
}

interface DailyClick {
  date: string;
  count: number;
}

export function BioAnalytics() {
  const [clicksByLink, setClicksByLink] = useState<ClickData[]>([]);
  const [dailyClicks, setDailyClicks] = useState<DailyClick[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30>(7);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), period));
      const endDate = endOfDay(new Date());

      // Fetch clicks grouped by link
      const { data: clicksData, error: clicksError } = await supabase
        .from("bio_link_clicks")
        .select("link_title, link_url, category, clicked_at")
        .gte("clicked_at", startDate.toISOString())
        .lte("clicked_at", endDate.toISOString());

      if (clicksError) throw clicksError;

      // Group by link
      const linkCounts: Record<string, ClickData> = {};
      const dailyCounts: Record<string, number> = {};

      clicksData?.forEach((click) => {
        // Group by link
        const key = click.link_title;
        if (!linkCounts[key]) {
          linkCounts[key] = {
            link_title: click.link_title,
            link_url: click.link_url,
            category: click.category,
            click_count: 0
          };
        }
        linkCounts[key].click_count++;

        // Group by day
        const dayKey = format(new Date(click.clicked_at), "yyyy-MM-dd");
        dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;
      });

      // Sort by clicks descending
      const sortedLinks = Object.values(linkCounts).sort((a, b) => b.click_count - a.click_count);
      setClicksByLink(sortedLinks);

      // Create daily data for the chart
      const dailyData: DailyClick[] = [];
      for (let i = period - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        dailyData.push({
          date: format(subDays(new Date(), i), "dd/MM", { locale: ptBR }),
          count: dailyCounts[date] || 0
        });
      }
      setDailyClicks(dailyData);

      setTotalClicks(clicksData?.length || 0);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const maxCount = Math.max(...clicksByLink.map(c => c.click_count), 1);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "premium":
        return "bg-amber-500";
      case "ebook":
        return "bg-blue-500";
      case "projeto":
        return "bg-purple-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Analytics da Bio
          </h2>
          <p className="text-muted-foreground">Acompanhe os cliques nos links da sua página Bio</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={period === 7 ? "default" : "outline"} 
            size="sm"
            onClick={() => setPeriod(7)}
          >
            7 dias
          </Button>
          <Button 
            variant={period === 30 ? "default" : "outline"} 
            size="sm"
            onClick={() => setPeriod(30)}
          >
            30 dias
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Cliques</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <MousePointerClick className="w-6 h-6 text-primary" />
              {loading ? "..." : totalClicks}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Últimos {period} dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Média Diária</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              {loading ? "..." : (totalClicks / period).toFixed(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Cliques por dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Links Ativos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              {loading ? "..." : clicksByLink.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Com pelo menos 1 clique</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cliques por Dia</CardTitle>
          <CardDescription>Evolução diária dos cliques nos últimos {period} dias</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {dailyClicks.map((day, index) => {
                const maxDaily = Math.max(...dailyClicks.map(d => d.count), 1);
                const height = (day.count / maxDaily) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{day.count}</span>
                    <div 
                      className="w-full bg-primary/80 rounded-t transition-all duration-300 hover:bg-primary"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{day.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Links</CardTitle>
          <CardDescription>Links mais clicados no período</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : clicksByLink.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum clique registrado no período
            </div>
          ) : (
            <div className="space-y-3">
              {clicksByLink.map((link, index) => (
                <div key={link.link_title} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{link.link_title}</span>
                      <Badge variant="secondary" className={`${getCategoryColor(link.category)} text-white text-[10px]`}>
                        {link.category}
                      </Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${(link.click_count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-bold text-lg min-w-[40px] text-right">
                    {link.click_count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}