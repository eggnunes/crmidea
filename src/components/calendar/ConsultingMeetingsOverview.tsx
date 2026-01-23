import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ExternalLink, Loader2, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, isToday, isTomorrow, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

type GoogleEventAttendee = {
  email?: string;
  displayName?: string;
  responseStatus?: string;
  organizer?: boolean;
  self?: boolean;
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

function getDateLabel(dateString: string) {
  const date = parseISO(dateString);
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  if (isThisWeek(date)) return format(date, "EEEE", { locale: ptBR });
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

export function ConsultingMeetingsOverview() {
  const { user } = useAuth();
  const { isConnected, listEvents } = useGoogleCalendar();

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [clients, setClients] = useState<ConsultingClientLite[]>([]);
  const [mode, setMode] = useState<MatchMode>("all");
  const [query, setQuery] = useState<string>("");

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

  // Auto-refresh on open/connection.
  useEffect(() => {
    if (!isConnected) return;
    fetchClients();
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, user?.id]);

  const matchedEvents = useMemo(() => {
    const byId = new Map<string, { client?: ConsultingClientLite; score: number }>();

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
        const emailHit = c.email && haystack.includes(safeLower(c.email));
        const nameHit = c.full_name && haystack.includes(safeLower(c.full_name));
        const score = (emailHit ? 2 : 0) + (nameHit ? 1 : 0);

        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }

      byId.set(ev.id, { client: bestScore > 0 ? best : undefined, score: bestScore });
    }

    return byId;
  }, [events, clients]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      const hasClient = !!matchedEvents.get(ev.id)?.client;
      if (mode === "clients" && !hasClient) return false;
      if (mode === "unmatched" && hasClient) return false;

      if (!q) return true;
      const clientName = matchedEvents.get(ev.id)?.client?.full_name;
      const clientEmail = matchedEvents.get(ev.id)?.client?.email;
      const searchable = safeLower([ev.summary, clientName, clientEmail].filter(Boolean).join(" "));
      return searchable.includes(q);
    });
  }, [events, matchedEvents, mode, query]);

  const groupedEvents = useMemo(() => {
    const grouped: Record<string, GoogleCalendarEvent[]> = {};
    for (const ev of filteredEvents) {
      const dateKey = (ev.start || "").split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(ev);
    }
    return grouped;
  }, [filteredEvents]);

  const matchedCount = useMemo(() => {
    let count = 0;
    for (const ev of filteredEvents) {
      if (matchedEvents.get(ev.id)?.client) count += 1;
    }
    return count;
  }, [filteredEvents, matchedEvents]);

  if (!isConnected) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Agenda da Consultoria
            </CardTitle>
            <CardDescription>
              Mostra todos os eventos (próx. 30 dias) e destaca os que batem com clientes.
              {filteredEvents.length > 0 && (
                <span className="ml-2">({matchedCount}/{filteredEvents.length} de clientes)</span>
              )}
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

      <CardContent>
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por cliente ou evento..."
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

        {loading && filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum evento encontrado com os filtros atuais</p>
          </div>
        ) : (
          <ScrollArea className="h-[520px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
                <div key={dateKey}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 capitalize">
                    {getDateLabel(dayEvents[0].start)}
                  </h4>

                  <div className="space-y-2">
                    {dayEvents.map((ev) => {
                      const match = matchedEvents.get(ev.id);
                      const matchedClient = match?.client;

                      return (
                        <div
                          key={ev.id}
                          className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{ev.summary}</span>
                              {matchedClient ? (
                                <Badge variant="default" className="whitespace-nowrap">
                                  Cliente: {matchedClient.full_name}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="whitespace-nowrap">
                                  Não associado
                                </Badge>
                              )}
                            </div>

                            {matchedClient && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Button asChild variant="outline" size="sm">
                                  <Link to={`/metodo-idea/consultoria/cliente/${matchedClient.id}`}>
                                    Abrir cliente
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </div>

                          <Button variant="ghost" size="sm" asChild>
                            <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
