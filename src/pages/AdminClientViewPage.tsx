import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft,
  Zap, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  User,
  Sparkles,
  Copy,
  Check,
  Loader2,
  ClipboardList,
  MessageSquare,
  Video,
  Users,
  CalendarCheck,
  TrendingUp,
  Trophy,
  BarChart3,
  FolderOpen,
  Rocket,
  Mail,
  Phone,
  Building2,
  MapPin,
  Edit,
  ExternalLink,
  Plus,
  FileCheck,
  BookOpen,
  Send,
  EyeOff,
  Eye
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ClientProgressFeedback } from "@/components/clients/ClientProgressFeedback";
import { ClientBadges } from "@/components/clients/ClientBadges";
import { ClientProgressCharts } from "@/components/clients/ClientProgressCharts";
import { ClientFormResponses } from "@/components/clients/ClientFormResponses";
import { ClientDocumentsManager } from "@/components/consulting/ClientDocumentsManager";
import { ConsultingSessionsManager } from "@/components/consulting/ConsultingSessionsManager";
import { PromptGenerator } from "@/components/consulting/PromptGenerator";
import { ClientCommunication } from "@/components/consulting/ClientCommunication";
import { ClientCommunicationHistory } from "@/components/consulting/ClientCommunicationHistory";
import { ClientMessageTemplates } from "@/components/consulting/ClientMessageTemplates";

interface ConsultingClient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  office_name: string;
  office_address: string;
  cidade: string | null;
  estado: string | null;
  num_lawyers: number;
  num_employees: number;
  practice_areas: string | null;
  status: string | null;
  created_at: string;
  generated_prompt: string | null;
  implementation_plan: unknown | null;
  selected_features: number[] | null;
  ai_familiarity_level: string | null;
  ai_tools_used: string | null;
}

interface FormProgress {
  id: string;
  current_step: number;
  form_data: unknown;
  is_completed: boolean;
  submitted_at: string | null;
}

interface ClientProfile {
  id: string;
  user_id: string;
  consultant_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  office_name: string | null;
  is_approved: boolean | null;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  is_visible_to_client: boolean;
}

interface ConsultingSession {
  id: string;
  session_date: string;
  title: string;
  summary: string | null;
  notes: string | null;
  next_steps: string | null;
  duration_minutes: number | null;
  session_type: string | null;
  status: string | null;
}

export function AdminClientViewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<ConsultingClient | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [formProgress, setFormProgress] = useState<FormProgress | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [sessions, setSessions] = useState<ConsultingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Timeline form state
  const [newEvent, setNewEvent] = useState({
    event_type: "note",
    title: "",
    description: "",
    is_visible_to_client: true,
  });
  const [addingEvent, setAddingEvent] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      // Fetch consulting client
      const { data: clientData, error: clientError } = await supabase
        .from("consulting_clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Fetch client profile by email
      const { data: profileData } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("email", clientData.email)
        .maybeSingle();

      if (profileData) {
        setClientProfile(profileData);

        // Fetch form progress
        const { data: progressData } = await supabase
          .from("diagnostic_form_progress")
          .select("*")
          .eq("client_user_id", profileData.user_id)
          .maybeSingle();

        if (progressData) {
          setFormProgress(progressData);
        }

        // Fetch timeline events
        const { data: timelineData } = await supabase
          .from("client_timeline_events")
          .select("*")
          .eq("client_user_id", profileData.user_id)
          .order("event_date", { ascending: false });

        if (timelineData) {
          setTimeline(timelineData);
        }
      }

      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from("consulting_sessions")
        .select("*")
        .eq("client_id", clientId)
        .order("session_date", { ascending: false });

      if (sessionsData) {
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
      toast.error("Erro ao carregar dados do cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (client?.generated_prompt) {
      await navigator.clipboard.writeText(client.generated_prompt);
      setCopied(true);
      toast.success("Prompt copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddTimelineEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error("Digite um título para o evento");
      return;
    }

    if (!clientProfile?.user_id || !user?.id) {
      toast.error("Erro ao identificar cliente ou consultor");
      return;
    }

    setAddingEvent(true);
    try {
      const { error } = await supabase.from("client_timeline_events").insert({
        client_user_id: clientProfile.user_id,
        consultant_id: user.id,
        event_type: newEvent.event_type,
        title: newEvent.title,
        description: newEvent.description || null,
        is_visible_to_client: newEvent.is_visible_to_client,
      });

      if (error) throw error;

      toast.success("Evento adicionado à timeline!");
      setNewEvent({ event_type: "note", title: "", description: "", is_visible_to_client: true });
      
      // Refresh timeline
      const { data: timelineData } = await supabase
        .from("client_timeline_events")
        .select("*")
        .eq("client_user_id", clientProfile.user_id)
        .order("event_date", { ascending: false });

      if (timelineData) {
        setTimeline(timelineData);
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Erro ao adicionar evento");
    } finally {
      setAddingEvent(false);
    }
  };

  const formProgressPercent = formProgress ? (formProgress.current_step / 6) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Button asChild variant="outline">
          <Link to="/metodo-idea/consultoria">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Consultoria
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-700">Em Andamento</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/metodo-idea/consultoria">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.full_name}</h1>
            {client.office_name && client.office_name !== "Não informado" && client.office_name !== "A preencher" && (
              <p className="text-muted-foreground">{client.office_name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(client.status)}
          <Badge variant="outline">
            {differenceInDays(new Date(), new Date(client.created_at))} dias de consultoria
          </Badge>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-mail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm truncate">{client.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{client.phone || "Não informado"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(client.num_lawyers > 1 || client.num_employees > 1) ? (
              <p className="text-sm">
                {client.num_lawyers} advogado(s), {client.num_employees} funcionário(s)
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Não informado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {client.cidade || client.estado 
                ? `${client.cidade || ""}${client.cidade && client.estado ? " - " : ""}${client.estado || ""}`
                : <span className="text-muted-foreground">Não informado</span>
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formProgress?.is_completed ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">100%</span>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground">Concluído</p>
                </>
              ) : formProgress && formProgress.current_step > 1 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{Math.round(formProgressPercent)}%</span>
                  </div>
                  <Progress value={formProgressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">Etapa {formProgress.current_step} de 6</p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-muted-foreground">-</span>
                  </div>
                  <Progress value={0} className="h-2" />
                  <p className="text-xs text-muted-foreground">Não iniciado</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Video className="w-4 h-4" />
              Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.filter(s => s.status === "completed").length}</div>
            <p className="text-sm text-muted-foreground">
              de {sessions.length} agendada(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Nível IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {client.ai_familiarity_level === "expert" ? "Avançado" :
               client.ai_familiarity_level === "intermediate" ? "Intermediário" :
               client.ai_familiarity_level === "beginner" ? "Iniciante" : 
               <span className="text-muted-foreground">Não informado</span>}
            </p>
            {client.ai_tools_used && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {client.ai_tools_used}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Próxima Reunião
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const nextSession = sessions
                .filter(s => s.status === "scheduled" && new Date(s.session_date) > new Date())
                .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0];
              return nextSession ? (
                <p className="text-sm">
                  {format(new Date(nextSession.session_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Não agendada</p>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="communication" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="communication">Comunicação</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="sessions">Reuniões</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="prompt">Prompt Gerado</TabsTrigger>
          <TabsTrigger value="responses">Respostas do Formulário</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="badges">Conquistas</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Communication Tab */}
        <TabsContent value="communication">
          <ClientCommunication 
            clientId={client.id}
            clientName={client.full_name}
            clientEmail={client.email}
            clientPhone={client.phone}
          />
        </TabsContent>

        <TabsContent value="history">
          <ClientCommunicationHistory
            clientEmail={client.email}
            clientPhone={client.phone}
            clientId={client.id}
            isAdminView
          />
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <ConsultingSessionsManager clientId={client.id} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <ClientDocumentsManager clientId={client.id} />
        </TabsContent>

        {/* Prompt Tab */}
        <TabsContent value="prompt">
          <PromptGenerator client={client} onUpdate={fetchClientData} />
        </TabsContent>

        {/* Form Responses Tab */}
          <TabsContent value="responses">
            <ClientFormResponses clientId={client.id} />
          </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <div className="space-y-6">
            <ClientProgressCharts clientId={client.id} />
            <ClientProgressFeedback clientId={client.id} userId={user?.id || ""} />
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges">
          <ClientBadges clientId={client.id} />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <div className="space-y-4">
            {/* Add Event Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Evento Manual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de Evento</Label>
                    <Select 
                      value={newEvent.event_type} 
                      onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">📝 Anotação</SelectItem>
                        <SelectItem value="call">📞 Ligação</SelectItem>
                        <SelectItem value="meeting">🎥 Reunião</SelectItem>
                        <SelectItem value="task">✅ Tarefa concluída</SelectItem>
                        <SelectItem value="document">📄 Documento enviado</SelectItem>
                        <SelectItem value="milestone">🎯 Marco alcançado</SelectItem>
                        <SelectItem value="feedback">💬 Feedback</SelectItem>
                        <SelectItem value="other">📌 Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Ex: Reunião de alinhamento"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Detalhes adicionais sobre o evento..."
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {newEvent.is_visible_to_client ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-orange-500" />
                    )}
                    <div>
                      <Label htmlFor="visibility-toggle" className="cursor-pointer">
                        Visível para o cliente
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {newEvent.is_visible_to_client 
                          ? "O cliente poderá ver este evento" 
                          : "Apenas você (admin) verá este evento"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="visibility-toggle"
                    checked={newEvent.is_visible_to_client}
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, is_visible_to_client: checked })}
                  />
                </div>
                <Button
                  onClick={handleAddTimelineEvent} 
                  disabled={addingEvent || !newEvent.title.trim()}
                  className="gap-2"
                >
                  {addingEvent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Adicionar à Timeline
                </Button>
              </CardContent>
            </Card>

            {/* Timeline Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timeline de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum evento registrado ainda
                  </p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {timeline.map((event) => (
                        <div key={event.id} className={`flex gap-4 items-start ${!event.is_visible_to_client ? 'bg-orange-50 dark:bg-orange-900/10 p-2 rounded-lg border border-orange-200 dark:border-orange-800' : ''}`}>
                          <div className={`w-2 h-2 rounded-full mt-2 ${!event.is_visible_to_client ? 'bg-orange-500' : 'bg-primary'}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium">{event.title}</p>
                                <Badge variant="outline" className="text-xs">
                                  {event.event_type}
                                </Badge>
                                {!event.is_visible_to_client && (
                                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300">
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Não visível ao cliente
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(event.event_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <ClientMessageTemplates filterType="all" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
