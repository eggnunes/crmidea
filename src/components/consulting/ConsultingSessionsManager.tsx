import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Video, Users, Clock, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConsultingSession {
  id: string;
  title: string;
  session_date: string;
  duration_minutes: number;
  session_type: string;
  status: string;
  notes: string | null;
  summary: string | null;
  next_steps: string | null;
  topics: string[] | null;
}

interface ConsultingSessionsManagerProps {
  clientId: string;
}

const sessionTypeLabels: Record<string, string> = {
  online: "Online",
  presential: "Presencial",
  phone: "Telefone",
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function ConsultingSessionsManager({ clientId }: ConsultingSessionsManagerProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ConsultingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ConsultingSession | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    session_date: "",
    duration_minutes: 60,
    session_type: "online",
    notes: "",
    summary: "",
    next_steps: "",
  });

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('consulting_sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('session_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Erro ao carregar reuniões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    try {
      if (selectedSession) {
        // Update existing session
        const { error } = await supabase
          .from('consulting_sessions')
          .update({
            ...formData,
            session_date: new Date(formData.session_date).toISOString(),
          })
          .eq('id', selectedSession.id);

        if (error) throw error;
        toast.success('Reunião atualizada!');
      } else {
        // Create new session
        const { error } = await supabase
          .from('consulting_sessions')
          .insert({
            ...formData,
            session_date: new Date(formData.session_date).toISOString(),
            client_id: clientId,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success('Reunião agendada!');
      }

      fetchSessions();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Erro ao salvar reunião');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      session_date: "",
      duration_minutes: 60,
      session_type: "online",
      notes: "",
      summary: "",
      next_steps: "",
    });
    setSelectedSession(null);
  };

  const openEditDialog = (session: ConsultingSession) => {
    setSelectedSession(session);
    setFormData({
      title: session.title,
      session_date: format(new Date(session.session_date), "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: session.duration_minutes,
      session_type: session.session_type,
      notes: session.notes || "",
      summary: session.summary || "",
      next_steps: session.next_steps || "",
    });
    setIsDialogOpen(true);
  };

  const updateSessionStatus = async (sessionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consulting_sessions')
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) throw error;
      fetchSessions();
      toast.success('Status atualizado!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Reuniões de Consultoria
            </CardTitle>
            <CardDescription>
              Gerencie as sessões e atas de reunião
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Agendar Reunião
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedSession ? "Editar Reunião" : "Nova Reunião"}
                </DialogTitle>
                <DialogDescription>
                  {selectedSession ? "Atualize as informações da reunião" : "Agende uma nova sessão de consultoria"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título da Reunião *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Primeira sessão - Diagnóstico"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="session_date">Data e Hora *</Label>
                    <Input
                      id="session_date"
                      type="datetime-local"
                      value={formData.session_date}
                      onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duração (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={15}
                      step={15}
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Reunião</Label>
                  <Select
                    value={formData.session_type}
                    onValueChange={(value) => setFormData({ ...formData, session_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="presential">Presencial</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notas / Ata da Reunião</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Registre os pontos discutidos..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Resumo</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Resumo da reunião..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="next_steps">Próximos Passos</Label>
                  <Textarea
                    id="next_steps"
                    value={formData.next_steps}
                    onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
                    placeholder="O que será feito até a próxima reunião..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {selectedSession ? "Salvar" : "Agendar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma reunião agendada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => openEditDialog(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{session.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(session.session_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        {session.session_type === "online" ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                        {sessionTypeLabels[session.session_type]}
                      </span>
                    </div>
                    {session.summary && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {session.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {session.notes && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        Ata
                      </Badge>
                    )}
                    <Select
                      value={session.status}
                      onValueChange={(value) => {
                        updateSessionStatus(session.id, value);
                      }}
                    >
                      <SelectTrigger 
                        className={`w-32 ${statusColors[session.status]}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Agendada</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
