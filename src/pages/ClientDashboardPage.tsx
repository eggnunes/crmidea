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
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User as SupabaseUser } from "@supabase/supabase-js";

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
}

export function ClientDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [formProgress, setFormProgress] = useState<FormProgress | null>(null);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [consultingClient, setConsultingClient] = useState<ConsultingClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/sobre-consultoria");
        return;
      }
      
      setUser(session.user);
      await fetchData(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/sobre-consultoria");
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
        const { data: clientData } = await supabase
          .from("consulting_clients")
          .select("id, generated_prompt, status")
          .eq("email", profileData.email)
          .maybeSingle();

        if (clientData) {
          setConsultingClient(clientData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/sobre-consultoria");
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
              <Link to="/sobre-consultoria">Voltar</Link>
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
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
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
        {/* Welcome Card */}
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
              
              {!formProgress?.is_completed && (
                <Button asChild className="gap-2">
                  <Link to={`/diagnostico-cliente`}>
                    {formProgress?.current_step === 1 ? "Iniciar Diagnóstico" : "Continuar Diagnóstico"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
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
                    {formProgress?.is_completed ? "Concluído" : `Etapa ${formProgress?.current_step || 1}/6`}
                  </span>
                  {formProgress?.is_completed && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <Progress value={formProgress?.is_completed ? 100 : formProgressPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Meetings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Reuniões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meetingNotes.length}</div>
              <p className="text-sm text-muted-foreground">
                {meetingNotes.length === 1 ? "reunião realizada" : "reuniões realizadas"}
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
              <Badge variant={consultingClient?.status === "completed" ? "default" : "secondary"}>
                {consultingClient?.status === "completed" ? "Concluído" : 
                 consultingClient?.status === "in_progress" ? "Em andamento" : "Pendente"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="meetings">Reuniões</TabsTrigger>
            <TabsTrigger value="prompt">Prompt Gerado</TabsTrigger>
          </TabsList>

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
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto max-h-[400px]">
                        {consultingClient.generated_prompt}
                      </pre>
                      <Button 
                        size="sm" 
                        className="absolute top-2 right-2 gap-2"
                        onClick={handleCopyPrompt}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copiado!" : "Copiar"}
                      </Button>
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
