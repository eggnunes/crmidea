import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, 
  Star, 
  Medal, 
  Zap, 
  Video, 
  MessageCircle, 
  Brain, 
  Rocket, 
  ClipboardCheck,
  MessagesSquare,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

interface EarnedBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

interface Props {
  clientId: string;
  totalPoints?: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'clipboard-check': ClipboardCheck,
  'video': Video,
  'message-circle': MessageCircle,
  'messages-square': MessagesSquare,
  'brain': Brain,
  'rocket': Rocket,
  'trophy': Trophy,
  'star': Star,
  'medal': Medal,
  'zap': Zap,
};

const categoryColors: Record<string, string> = {
  progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  engagement: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  milestone: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  special: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
};

const categoryLabels: Record<string, string> = {
  progress: "Progresso",
  engagement: "Engajamento",
  milestone: "Marco",
  special: "Especial",
};

export function ClientBadges({ clientId, totalPoints = 0 }: Props) {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [clientId]);

  const fetchBadges = async () => {
    try {
      // Fetch all badges
      const { data: badges, error: badgesError } = await supabase
        .from("client_badges")
        .select("*")
        .order("points", { ascending: true });

      if (badgesError) throw badgesError;
      setAllBadges(badges || []);

      // Fetch earned badges
      const { data: earned, error: earnedError } = await supabase
        .from("client_earned_badges")
        .select(`
          id,
          badge_id,
          earned_at,
          badge:client_badges(*)
        `)
        .eq("client_id", clientId)
        .order("earned_at", { ascending: false });

      if (earnedError) throw earnedError;
      
      // Type cast the response
      const typedEarned = (earned || []).map(e => ({
        id: e.id,
        badge_id: e.badge_id,
        earned_at: e.earned_at,
        badge: e.badge as unknown as Badge
      }));
      
      setEarnedBadges(typedEarned);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.badge_id));
  const earnedPoints = earnedBadges.reduce((sum, eb) => sum + (eb.badge?.points || 0), 0);
  const maxPoints = allBadges.reduce((sum, b) => sum + b.points, 0);
  const progressPercent = maxPoints > 0 ? (earnedPoints / maxPoints) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Suas Conquistas
              </h3>
              <p className="text-sm text-muted-foreground">
                {earnedBadges.length} de {allBadges.length} badges conquistados
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{earnedPoints}</div>
              <div className="text-sm text-muted-foreground">pontos</div>
            </div>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(progressPercent)}% do caminho percorrido
          </p>
        </CardContent>
      </Card>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Badges Conquistados</CardTitle>
            <CardDescription>Continue assim! 🎉</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {earnedBadges.map((earned) => {
                const IconComponent = iconMap[earned.badge?.icon] || Star;
                return (
                  <div
                    key={earned.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{earned.badge?.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          +{earned.badge?.points}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {earned.badge?.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Conquistado em {format(new Date(earned.earned_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximos Desafios</CardTitle>
          <CardDescription>Complete as ações para desbloquear</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="grid gap-3 sm:grid-cols-2">
              {allBadges
                .filter(badge => !earnedBadgeIds.has(badge.id))
                .map((badge) => {
                  const IconComponent = iconMap[badge.icon] || Star;
                  return (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border opacity-60"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate text-muted-foreground">{badge.name}</h4>
                          <Badge variant="outline" className={`text-xs ${categoryColors[badge.category]}`}>
                            {categoryLabels[badge.category]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {badge.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          🔒 +{badge.points} pontos
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
