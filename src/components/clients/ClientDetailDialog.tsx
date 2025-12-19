import { useState } from "react";
import { Client } from "@/hooks/useClients";
import { useClientSessions, ClientSession, SessionInsert } from "@/hooks/useClientSessions";
import { useClientMilestones, ClientMilestone, MilestoneInsert } from "@/hooks/useClientMilestones";
import { useClientTimeline } from "@/hooks/useClientTimeline";
import { PRODUCTS } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Plus,
  FileText,
  CheckCircle2,
  Circle,
  Target,
  MessageSquare,
  Trash2,
  Edit,
  User,
  Briefcase,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Award,
  Loader2,
} from "lucide-react";

interface ClientDetailDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SESSION_TYPES = [
  { id: "reuniao", name: "Reunião" },
  { id: "call", name: "Call" },
  { id: "mensagem", name: "Mensagem" },
  { id: "entrega", name: "Entrega" },
];

const MILESTONE_CATEGORIES = [
  { id: "onboarding", name: "Onboarding" },
  { id: "implementacao", name: "Implementação" },
  { id: "revisao", name: "Revisão" },
  { id: "entrega", name: "Entrega" },
  { id: "geral", name: "Geral" },
];

const EVENT_ICONS: Record<string, React.ReactNode> = {
  contrato_assinado: <FileText className="w-4 h-4" />,
  sessao_realizada: <MessageSquare className="w-4 h-4" />,
  milestone_concluido: <CheckCircle2 className="w-4 h-4" />,
  entrega: <Target className="w-4 h-4" />,
  observacao: <Edit className="w-4 h-4" />,
  pagamento: <DollarSign className="w-4 h-4" />,
};

export function ClientDetailDialog({ client, open, onOpenChange }: ClientDetailDialogProps) {
  const { sessions, loading: loadingSessions, addSession, deleteSession } = useClientSessions(client.id);
  const { milestones, loading: loadingMilestones, addMilestone, toggleMilestone, deleteMilestone, progress } = useClientMilestones(client.id);
  const { events, loading: loadingTimeline, addEvent } = useClientTimeline(client.id);

  const [activeTab, setActiveTab] = useState("prontuario");
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Session form state
  const [sessionForm, setSessionForm] = useState<Partial<SessionInsert>>({
    client_id: client.id,
    session_date: new Date().toISOString().slice(0, 16),
    session_type: "reuniao",
    title: "",
    summary: "",
    notes: "",
    topics: [],
    next_steps: "",
    duration_minutes: 60,
    status: "realizada",
  });

  // Milestone form state
  const [milestoneForm, setMilestoneForm] = useState<Partial<MilestoneInsert>>({
    client_id: client.id,
    title: "",
    description: "",
    category: "geral",
    due_date: null,
    is_completed: false,
    order_index: milestones.length,
  });

  // Note form state
  const [noteForm, setNoteForm] = useState({
    title: "",
    description: "",
  });

  const [topicInput, setTopicInput] = useState("");

  const product = PRODUCTS.find(p => p.id === client.product_type);

  const handleAddSession = async () => {
    if (!sessionForm.title) return;
    await addSession(sessionForm as SessionInsert);
    setIsAddingSession(false);
    setSessionForm({
      client_id: client.id,
      session_date: new Date().toISOString().slice(0, 16),
      session_type: "reuniao",
      title: "",
      summary: "",
      notes: "",
      topics: [],
      next_steps: "",
      duration_minutes: 60,
      status: "realizada",
    });
  };

  const handleAddMilestone = async () => {
    if (!milestoneForm.title) return;
    await addMilestone(milestoneForm as MilestoneInsert);
    setIsAddingMilestone(false);
    setMilestoneForm({
      client_id: client.id,
      title: "",
      description: "",
      category: "geral",
      due_date: null,
      is_completed: false,
      order_index: milestones.length + 1,
    });
  };

  const handleAddNote = async () => {
    if (!noteForm.title) return;
    await addEvent({
      client_id: client.id,
      event_type: "observacao",
      title: noteForm.title,
      description: noteForm.description,
      event_date: new Date().toISOString(),
      reference_id: null,
      reference_type: null,
    });
    setIsAddingNote(false);
    setNoteForm({ title: "", description: "" });
  };

  const addTopic = () => {
    if (topicInput.trim() && sessionForm.topics) {
      setSessionForm({
        ...sessionForm,
        topics: [...sessionForm.topics, topicInput.trim()],
      });
      setTopicInput("");
    }
  };

  const removeTopic = (index: number) => {
    if (sessionForm.topics) {
      setSessionForm({
        ...sessionForm,
        topics: sessionForm.topics.filter((_, i) => i !== index),
      });
    }
  };

  // Group sessions by topic
  const sessionsByTopic = sessions.reduce((acc, session) => {
    session.topics.forEach(topic => {
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(session);
    });
    return acc;
  }, {} as Record<string, ClientSession[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{client.name}</h2>
              <p className="text-sm text-muted-foreground font-normal">
                {product?.name || client.product_type} • Desde {format(new Date(client.contract_start_date), "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="prontuario">Prontuário</TabsTrigger>
            <TabsTrigger value="sessoes">Sessões</TabsTrigger>
            <TabsTrigger value="etapas">Etapas</TabsTrigger>
            <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Prontuário Tab */}
            <TabsContent value="prontuario" className="m-0 space-y-4">
              {/* Client Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" /> Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {(client.cidade || client.estado) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{[client.cidade, client.estado].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Dados Profissionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {client.area_atuacao && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span>{client.area_atuacao}</span>
                      </div>
                    )}
                    {client.oab_number && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span>OAB: {client.oab_number}</span>
                      </div>
                    )}
                    {client.escritorio && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span>{client.escritorio}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Objectives & Challenges */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {client.objectives || "Nenhum objetivo registrado"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Desafios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {client.challenges || "Nenhum desafio registrado"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Progresso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Etapas concluídas</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Add Note */}
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Observações Rápidas</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setIsAddingNote(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </CardHeader>
                {isAddingNote && (
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Título da observação"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Descrição..."
                      value={noteForm.description}
                      onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddNote}>Salvar</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsAddingNote(false)}>Cancelar</Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            {/* Sessões Tab */}
            <TabsContent value="sessoes" className="m-0 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Sessões ({sessions.length})</h3>
                <Button size="sm" onClick={() => setIsAddingSession(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Nova Sessão
                </Button>
              </div>

              {isAddingSession && (
                <Card className="border-primary/50">
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Título *</Label>
                        <Input
                          value={sessionForm.title}
                          onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                          placeholder="Ex: Sessão de Implementação"
                        />
                      </div>
                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={sessionForm.session_type}
                          onValueChange={(v) => setSessionForm({ ...sessionForm, session_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SESSION_TYPES.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Data e Hora</Label>
                        <Input
                          type="datetime-local"
                          value={sessionForm.session_date}
                          onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Duração (min)</Label>
                        <Input
                          type="number"
                          value={sessionForm.duration_minutes}
                          onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Resumo</Label>
                      <Textarea
                        value={sessionForm.summary || ''}
                        onChange={(e) => setSessionForm({ ...sessionForm, summary: e.target.value })}
                        placeholder="O que foi discutido?"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Notas Detalhadas</Label>
                      <Textarea
                        value={sessionForm.notes || ''}
                        onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                        placeholder="Anotações detalhadas..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Temas Abordados</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={topicInput}
                          onChange={(e) => setTopicInput(e.target.value)}
                          placeholder="Ex: ChatGPT, Automação..."
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                        />
                        <Button type="button" variant="outline" onClick={addTopic}>+</Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sessionForm.topics?.map((topic, i) => (
                          <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeTopic(i)}>
                            {topic} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Próximos Passos</Label>
                      <Textarea
                        value={sessionForm.next_steps || ''}
                        onChange={(e) => setSessionForm({ ...sessionForm, next_steps: e.target.value })}
                        placeholder="O que fazer a seguir?"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddSession}>Salvar Sessão</Button>
                      <Button variant="outline" onClick={() => setIsAddingSession(false)}>Cancelar</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sessions by Date */}
              {loadingSessions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma sessão registrada</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map(session => (
                    <Card key={session.id} className="hover:bg-secondary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{session.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {SESSION_TYPES.find(t => t.id === session.session_type)?.name}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(session.session_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {session.duration_minutes} min
                              </span>
                            </div>
                            {session.summary && (
                              <p className="text-sm text-muted-foreground mb-2">{session.summary}</p>
                            )}
                            {session.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {session.topics.map((topic, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{topic}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteSession(session.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Sessions by Topic */}
              {Object.keys(sessionsByTopic).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Por Tema</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(sessionsByTopic).map(([topic, topicSessions]) => (
                      <Card key={topic}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">{topic}</span>
                            <Badge variant="secondary">{topicSessions.length}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Etapas Tab */}
            <TabsContent value="etapas" className="m-0 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Etapas do Cliente</h3>
                  <p className="text-sm text-muted-foreground">{Math.round(progress)}% concluído</p>
                </div>
                <Button size="sm" onClick={() => setIsAddingMilestone(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Nova Etapa
                </Button>
              </div>

              <Progress value={progress} className="h-3" />

              {isAddingMilestone && (
                <Card className="border-primary/50">
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Título *</Label>
                        <Input
                          value={milestoneForm.title}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                          placeholder="Ex: Configurar ChatGPT"
                        />
                      </div>
                      <div>
                        <Label>Categoria</Label>
                        <Select
                          value={milestoneForm.category || 'geral'}
                          onValueChange={(v) => setMilestoneForm({ ...milestoneForm, category: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MILESTONE_CATEGORIES.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Data Prevista</Label>
                        <Input
                          type="date"
                          value={milestoneForm.due_date || ''}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value || null })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={milestoneForm.description || ''}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                          placeholder="Detalhes da etapa..."
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddMilestone}>Salvar Etapa</Button>
                      <Button variant="outline" onClick={() => setIsAddingMilestone(false)}>Cancelar</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {loadingMilestones ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : milestones.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma etapa definida</p>
              ) : (
                <div className="space-y-2">
                  {milestones.map(milestone => (
                    <Card key={milestone.id} className={cn(
                      "transition-colors",
                      milestone.is_completed && "bg-success/5 border-success/20"
                    )}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Checkbox
                          checked={milestone.is_completed}
                          onCheckedChange={() => toggleMilestone(milestone.id)}
                          className="h-5 w-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium",
                              milestone.is_completed && "line-through text-muted-foreground"
                            )}>
                              {milestone.title}
                            </span>
                            {milestone.category && (
                              <Badge variant="outline" className="text-xs">{milestone.category}</Badge>
                            )}
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          )}
                          {milestone.due_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Prazo: {format(new Date(milestone.due_date), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteMilestone(milestone.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="m-0 space-y-4">
              <h3 className="font-semibold">Linha do Tempo</h3>

              {loadingTimeline ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum evento registrado</p>
              ) : (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
                  {events.map(event => (
                    <div key={event.id} className="relative flex gap-4">
                      <div className="absolute -left-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center border-2 border-background">
                        {EVENT_ICONS[event.event_type] || <Circle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 bg-secondary/30 rounded-lg p-3 ml-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.event_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
