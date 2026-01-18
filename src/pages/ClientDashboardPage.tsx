import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Zap, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  LogOut,
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
  Send,
  Trophy,
  BarChart3,
  FolderOpen,
  Rocket,
  Edit
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { ClientProgressFeedback } from "@/components/clients/ClientProgressFeedback";
import { ClientBadges } from "@/components/clients/ClientBadges";
import { ClientProgressCharts } from "@/components/clients/ClientProgressCharts";
import { ClientFormResponses } from "@/components/clients/ClientFormResponses";
import { ClientDocumentsManagerReadOnly } from "@/components/consulting/ClientDocumentsManagerReadOnly";
import { ClientCommunicationHistory } from "@/components/consulting/ClientCommunicationHistory";


interface ClientProfile {
  id: string;
  user_id: string;
  consultant_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  office_name: string | null;
}

interface FormProgress {
  id: string;
  current_step: number;
  form_data: unknown;
  is_completed: boolean;
  submitted_at: string | null;
}

interface MeetingNote {
  id: string;
  meeting_date: string;
  title: string;
  summary: string | null;
  notes: string | null;
  next_steps: string | null;
  duration_minutes: number | null;
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

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
}

interface ConsultingClient {
  id: string;
  generated_prompt: string | null;
  status: string | null;
  created_at: string;
  implementation_plan: unknown | null;
}

export function ClientDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [formProgress, setFormProgress] = useState<FormProgress | null>(null);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [sessions, setSessions] = useState<ConsultingSession[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [consultingClient, setConsultingClient] = useState<ConsultingClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/consultoria");
        return;
      }
      
      setUser(session.user);
      await fetchData(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/consultoria");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchData = async (userId: string) => {
    try {
      // Fetch client profile
      const { data: profileData } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);

        // Sync calendar sessions in background (don't wait for it)
        syncCalendarSessions(profileData.email, profileData.consultant_id);

        // Fetch form progress
        const { data: progressData } = await supabase
          .from("diagnostic_form_progress")
          .select("*")
          .eq("client_user_id", userId)
          .maybeSingle();

        if (progressData) {
          setFormProgress(progressData);
        }

        // Fetch meeting notes
        const { data: notesData } = await supabase
          .from("client_meeting_notes")
          .select("*")
          .eq("client_user_id", userId)
          .order("meeting_date", { ascending: false });

        if (notesData) {
          setMeetingNotes(notesData);
        }

        // Fetch timeline
        const { data: timelineData } = await supabase
          .from("client_timeline_events")
          .select("*")
          .eq("client_user_id", userId)
          .order("event_date", { ascending: false });

        if (timelineData) {
          setTimeline(timelineData);
        }

        // Fetch consulting client data (generated prompt)
        const { data: clientData, error: clientError } = await supabase
          .from("consulting_clients")
          .select("id, generated_prompt, status, created_at, implementation_plan")
          .eq("email", profileData.email)
          .maybeSingle();

        if (clientError) {
          console.error("Error fetching consulting client:", clientError);
        }

        if (clientData) {
          console.log("Consulting client data loaded:", { 
            id: clientData.id, 
            hasPlan: !!clientData.implementation_plan,
            hasPrompt: !!clientData.generated_prompt 
          });
          setConsultingClient(clientData);
        } else {
          console.log("No consulting client found for email:", profileData.email);
        }

        // Fetch consulting sessions
        if (clientData) {
          const { data: sessionsData } = await supabase
            .from("consulting_sessions")
            .select("*")
            .eq("client_id", clientData.id)
            .order("session_date", { ascending: false });

          if (sessionsData) {
            setSessions(sessionsData);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync Google Calendar events with consulting sessions
  const syncCalendarSessions = async (clientEmail: string, consultantId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("sync-calendar-sessions", {
        body: { clientEmail, consultantId }
      });
      
      if (error) {
        console.error("Error syncing calendar sessions:", error);
        return;
      }
      
      if (data?.synced > 0) {
        console.log(`Synced ${data.synced} calendar events`);
        // Refresh sessions after sync
        const { data: clientData } = await supabase
          .from("consulting_clients")
          .select("id")
          .eq("email", clientEmail)
          .maybeSingle();
          
        if (clientData) {
          const { data: sessionsData } = await supabase
            .from("consulting_sessions")
            .select("*")
            .eq("client_id", clientData.id)
            .order("session_date", { ascending: false });

          if (sessionsData) {
            setSessions(sessionsData);
          }
        }
      }
    } catch (error) {
      console.error("Error syncing calendar:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/consultoria");
  };

  const handleCopyPrompt = async () => {
    if (consultingClient?.generated_prompt) {
      await navigator.clipboard.writeText(consultingClient.generated_prompt);
      setCopied(true);
      toast.success("Prompt copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formProgressPercent = formProgress ? (formProgress.current_step / 6) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Perfil de cliente não encontrado. Por favor, cadastre-se novamente.
            </p>
            <Button asChild>
              <Link to="/">Voltar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-consultoria-idea.png" 
              alt="Consultoria IDEA" 
              className="h-16 md:h-20 w-auto object-contain"
            />
            <div>
              <h1 className="font-bold text-lg">Área do Cliente</h1>
              <p className="text-sm text-muted-foreground">Consultoria IDEA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-medium text-sm">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Alert: Form not completed */}
        {!formProgress?.is_completed && (
          <Card className="mb-6 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-700">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-amber-800 dark:text-amber-300">
                    📋 Complete seu Diagnóstico!
                  </h3>
                  <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                    Para iniciarmos a sua consultoria, precisamos que você preencha o formulário de diagnóstico. 
                    Isso nos ajudará a entender melhor o seu escritório e personalizar a consultoria para você.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={(formProgress?.current_step || 1) / 6 * 100} className="h-2 flex-1 max-w-xs" />
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Etapa {formProgress?.current_step || 1} de 6
                    </span>
                  </div>
                </div>
                <Button asChild size="lg" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                  <Link to="/consultoria/diagnostico">
                    {formProgress?.current_step === 1 ? "Iniciar Diagnóstico" : "Continuar Preenchendo"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alert: Edit Feature Priorities (when form is completed) */}
        {formProgress?.is_completed && consultingClient && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-700">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <Edit className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-300">
                    ✏️ Ajuste as Prioridades das Funcionalidades
                  </h3>
                  <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                    Defina quais funcionalidades são mais importantes para você. 
                    Isso nos ajuda a criar um plano de implementação personalizado, começando pelas prioridades altas.
                  </p>
                </div>
                <Button asChild size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Link to="/consultoria/editar-prioridades">
                    Editar Prioridades
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Olá, {profile.full_name.split(" ")[0]}! 👋
                </h2>
                <p className="text-muted-foreground">
                  Acompanhe o progresso da sua consultoria e acesse seus materiais.
                </p>
              </div>
              
              {formProgress?.is_completed && (
                <Badge variant="default" className="bg-green-500 text-white gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Diagnóstico Concluído
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {/* Form Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formProgress?.is_completed ? "100%" : `${Math.round(formProgressPercent)}%`}
                  </span>
                  {formProgress?.is_completed && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <Progress value={formProgress?.is_completed ? 100 : formProgressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {formProgress?.is_completed ? "Concluído" : `Etapa ${formProgress?.current_step || 1} de 6`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sessions Count */}
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

          {/* Days in Consulting */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consultingClient?.created_at 
                  ? differenceInDays(new Date(), new Date(consultingClient.created_at))
                  : 0} dias
              </div>
              <p className="text-sm text-muted-foreground">
                desde o início
              </p>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                variant={consultingClient?.status === "completed" ? "default" : "secondary"}
                className={
                  consultingClient?.status === "completed" ? "bg-green-500" :
                  consultingClient?.status === "in_progress" ? "bg-blue-500" : ""
                }
              >
                {consultingClient?.status === "completed" ? "Concluído" : 
                 consultingClient?.status === "in_progress" ? "Em andamento" : "Pendente"}
              </Badge>
              {sessions.some(s => s.status === "scheduled") && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <CalendarCheck className="w-3 h-3" />
                  Próxima reunião agendada
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Next Meeting Alert */}
        {sessions.filter(s => s.status === "scheduled").length > 0 && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Próxima Reunião</h3>
                  {(() => {
                    const nextSession = sessions
                      .filter(s => s.status === "scheduled")
                      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0];
                    return nextSession ? (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{nextSession.title}</span> - {" "}
                        {format(new Date(nextSession.session_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        <Badge variant="outline" className="ml-2">
                          {nextSession.session_type === "online" ? "Online" : 
                           nextSession.session_type === "presential" ? "Presencial" : "Telefone"}
                        </Badge>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="sessions">Reuniões</TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="communications" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Comunicações
            </TabsTrigger>
            <TabsTrigger value="responses" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Minhas Respostas
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <Send className="w-4 h-4" />
              Meu Progresso
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Trophy className="w-4 h-4" />
              Conquistas
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Evolução
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="prompt">Prompt Gerado</TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents">
            {consultingClient ? (
              <ClientDocumentsManagerReadOnly clientId={consultingClient.id} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum documento disponível ainda.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications">
            <ClientCommunicationHistory 
              clientEmail={profile.email}
              clientPhone={profile.phone || undefined}
            />
          </TabsContent>

          {/* Form Responses Tab */}
          <TabsContent value="responses">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Minhas Respostas do Diagnóstico
                </CardTitle>
                <CardDescription>
                  Visualize todas as informações que você forneceu no formulário de diagnóstico
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formProgress?.is_completed ? (
                  <ClientFormResponses clientEmail={profile.email} />
                ) : (
                  <div className="text-center py-8">
                    <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Complete o diagnóstico para visualizar suas respostas aqui.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Feedback Tab */}
          <TabsContent value="progress">
            {consultingClient && user ? (
              <ClientProgressFeedback clientId={consultingClient.id} userId={user.id} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Complete o diagnóstico para acessar esta seção.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            {consultingClient ? (
              <ClientBadges clientId={consultingClient.id} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Complete o diagnóstico para acessar suas conquistas.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts">
            {consultingClient ? (
              <ClientProgressCharts clientId={consultingClient.id} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Complete o diagnóstico para ver sua evolução.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Histórico de Reuniões
                </CardTitle>
                <CardDescription>Acompanhe todas as sessões de consultoria</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma reunião agendada ainda.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Aguarde o contato para agendarmos sua primeira sessão.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-4 border rounded-lg ${
                          session.status === "completed" ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20" :
                          session.status === "scheduled" ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20" :
                          ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{session.title}</h4>
                              <Badge
                                variant="outline"
                                className={
                                  session.status === "completed" ? "bg-green-100 text-green-700" :
                                  session.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                                  "bg-red-100 text-red-700"
                                }
                              >
                                {session.status === "completed" ? "Concluída" :
                                 session.status === "scheduled" ? "Agendada" : "Cancelada"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(session.session_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              {session.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {session.duration_minutes} min
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                {session.session_type === "online" ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                {session.session_type === "online" ? "Online" : 
                                 session.session_type === "presential" ? "Presencial" : "Telefone"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {session.summary && (
                          <div className="mt-3 p-3 bg-background rounded border">
                            <p className="text-sm font-medium mb-1">Resumo:</p>
                            <p className="text-sm text-muted-foreground">{session.summary}</p>
                          </div>
                        )}
                        
                        {session.next_steps && (
                          <div className="mt-2 p-3 bg-background rounded border">
                            <p className="text-sm font-medium mb-1">Próximos passos:</p>
                            <p className="text-sm text-muted-foreground">{session.next_steps}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Evolução da Consultoria</CardTitle>
                <CardDescription>Histórico de todas as atividades</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum evento registrado ainda.
                  </p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {timeline.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              event.event_type === "signup" ? "bg-green-500" :
                              event.event_type === "meeting" ? "bg-blue-500" :
                              event.event_type === "form" ? "bg-yellow-500" :
                              "bg-primary"
                            }`} />
                            {index < timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{event.title}</p>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(event.event_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings">
            <Card>
              <CardHeader>
                <CardTitle>Atas de Reunião</CardTitle>
                <CardDescription>Histórico das reuniões de consultoria</CardDescription>
              </CardHeader>
              <CardContent>
                {meetingNotes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma reunião registrada ainda.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {meetingNotes.map((note) => (
                      <Card key={note.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{note.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(note.meeting_date), "dd/MM/yyyy", { locale: ptBR })}
                              {note.duration_minutes && (
                                <>
                                  <Clock className="w-4 h-4 ml-2" />
                                  {note.duration_minutes}min
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {note.summary && (
                            <div>
                              <p className="text-sm font-medium">Resumo:</p>
                              <p className="text-sm text-muted-foreground">{note.summary}</p>
                            </div>
                          )}
                          {note.next_steps && (
                            <div>
                              <p className="text-sm font-medium">Próximos passos:</p>
                              <p className="text-sm text-muted-foreground">{note.next_steps}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompt Tab */}
          <TabsContent value="prompt">
            <div className="space-y-4">
              {/* Aviso para criar conta no Lovable */}
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Rocket className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-blue-800 dark:text-blue-300">
                        🚀 Primeiro, crie sua conta no Lovable!
                      </h3>
                      <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                        Antes de usar o prompt abaixo, você precisa criar sua conta gratuita no Lovable.dev. 
                        O Lovable é a plataforma de IA que vai construir sua intranet automaticamente com base no prompt gerado.
                      </p>
                    </div>
                    <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                      <a href="https://lovable.dev/invite/IX8ILR2" target="_blank" rel="noopener noreferrer">
                        Criar Conta no Lovable
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Prompt para o Lovable
                  </CardTitle>
                  <CardDescription>
                    Use este prompt no Lovable para criar sua intranet personalizada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {consultingClient?.generated_prompt ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Clique no ícone para copiar o prompt</span>
                        <Button 
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={handleCopyPrompt}
                          title={copied ? "Copiado!" : "Copiar prompt"}
                        >
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div>
                        <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto max-h-[400px]">
                          {consultingClient.generated_prompt}
                        </pre>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Cole este prompt no Lovable para iniciar a criação da sua intranet.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        O prompt será gerado após a conclusão do diagnóstico e análise pela equipe.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
