import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Loader2, RefreshCw, Search, Users } from "lucide-react";
import { format, isAfter, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type GoogleEventAttendee = {
  email?: string;
};

type GoogleCalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string;
  description?: string;
  attendees?: GoogleEventAttendee[];
};

type ConsultingClientLite = {
  id: string;
  full_name: string;
  email: string;
};

type MatchMode = "all" | "clients" | "unmatched";

function safeLower(s?: string | null) {
  return (s || "").toLowerCase();
}

export function UpcomingMeetingsAdminPanel() {
  const { user } = useAuth();
  const { isConnected, listEvents } = useGoogleCalendar();

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [clients, setClients] = useState<ConsultingClientLite[]>([]);
  const [mode, setMode] = useState<MatchMode>("all");
  const [query, setQuery] = useState("");

  const fetchClients = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("consulting_clients")
      .select("id, full_name, email")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching consulting clients:", error);
      toast.error("Erro ao carregar clientes");
      return;
    }

    setClients((data || []) as ConsultingClientLite[]);
  };

  const fetchEvents = async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const list = (await listEvents()) as GoogleCalendarEvent[];
      setEvents(list || []);
    } catch (e) {
      console.error("Error listing calendar events:", e);
      toast.error("Erro ao carregar eventos do calendário");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isConnected) return;
    fetchClients();
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, user?.id]);

  const matchedByEventId = useMemo(() => {
    const byId = new Map<string, ConsultingClientLite | undefined>();

    for (const ev of events) {
      const haystack = safeLower(
        [
          ev.summary,
          ev.description,
          (ev.attendees || []).map((a) => a.email).filter(Boolean).join(" "),
        ].join(" ")
      );

      let best: ConsultingClientLite | undefined;
      let bestScore = 0;
      for (const c of clients) {
        const score = (c.email && haystack.includes(safeLower(c.email)) ? 2 : 0) +
          (c.full_name && haystack.includes(safeLower(c.full_name)) ? 1 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      byId.set(ev.id, bestScore > 0 ? best : undefined);
    }

    return byId;
  }, [events, clients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      const m = matchedByEventId.get(ev.id);
      if (mode === "clients" && !m) return false;
      if (mode === "unmatched" && m) return false;

      if (!q) return true;

      const searchable = safeLower([ev.summary, m?.full_name, m?.email].filter(Boolean).join(" "));
      return searchable.includes(q);
    });
  }, [events, matchedByEventId, mode, query]);

  const nextItems = useMemo(() => {
    const now = new Date();
    return [...filtered]
      .filter((ev) => {
        try {
          return isAfter(parseISO(ev.start), now);
        } catch {
          return false;
        }
      })
      .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())
      .slice(0, 12);
  }, [filtered]);

  const countsByWeek = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of nextItems) {
      const weekStart = startOfWeek(parseISO(ev.start), { weekStartsOn: 1 });
      const key = format(weekStart, "dd/MM", { locale: ptBR });
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].map(([week, count]) => ({ week, count }));
  }, [nextItems]);

  if (!isConnected) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas reuniões (admin)
            </CardTitle>
            <CardDescription>
              Contagem por semana + links rápidos para abrir o dashboard do cliente.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por evento ou cliente..."
              className="pl-9"
            />
          </div>
          <Select value={mode} onValueChange={(v) => setMode(v as MatchMode)}>
            <SelectTrigger className="w-full lg:w-64">
              <SelectValue placeholder="Filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="clients">Somente clientes</SelectItem>
              <SelectItem value="unmatched">Somente não associados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {countsByWeek.length === 0 ? (
            <Badge variant="secondary">Sem reuniões futuras</Badge>
          ) : (
            countsByWeek.map((w) => (
              <Badge key={w.week} variant="outline">
                Semana {w.week}: {w.count}
              </Badge>
            ))
          )}
        </div>

        {nextItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma reunião encontrada com os filtros atuais.</div>
        ) : (
          <div className="space-y-2">
            {nextItems.map((ev) => {
              const client = matchedByEventId.get(ev.id);
              return (
                <div key={ev.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{ev.summary}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                      <span>{format(parseISO(ev.start), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                      {client ? (
                        <Badge variant="default" className="gap-1">
                          <Users className="w-3 h-3" />
                          {client.full_name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Não associado</Badge>
                      )}
                    </div>
                  </div>

                  {client ? (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/metodo-idea/consultoria/cliente/${client.id}`}>Abrir</Link>
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
