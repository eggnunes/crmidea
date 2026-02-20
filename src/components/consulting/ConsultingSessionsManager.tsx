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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Calendar, Plus, Video, Users, Clock, FileText, Loader2,
  RefreshCw, ExternalLink, FileAudio, Brain, ChevronDown, Download, RotateCcw
} from "lucide-react";
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
  recording_url: string | null;
  recording_drive_id: string | null;
  transcription: string | null;
  ai_summary: string | null;
  summary_generated_at: string | null;
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
  const [summaryDialogSession, setSummaryDialogSession] = useState<ConsultingSession | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [autoProcessing, setAutoProcessing] = useState(false);
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
      setSessions((data as ConsultingSession[]) || []);
      return (data as ConsultingSession[]) || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Erro ao carregar reuniões');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /** Auto-process: sync recordings → then transcribe+summarize any pending sessions */
  const autoProcess = async () => {
    if (!user?.id || autoProcessing) return;
    setAutoProcessing(true);
    try {
      // Step 1: Sync recordings from Google Drive
      const { data: syncData } = await supabase.functions.invoke('sync-meet-recordings', {
        body: { clientId },
      });
      const syncedCount = syncData?.synced || 0;

      // Step 2: Reload sessions after sync
      const updatedSessions = await fetchSessions();

      // Step 3: Find sessions with recording_drive_id but no transcription → transcribe + summarize
      const pendingTranscription = updatedSessions.filter(
        (s) => s.recording_drive_id && !s.transcription
      );

      for (const session of pendingTranscription) {
        try {
          await supabase.functions.invoke('transcribe-recording', {
            body: {
              userId: user.id,
              sessionId: session.id,
              fileId: session.recording_drive_id,
              force: false,
            },
          });
        } catch (e) {
          console.warn(`[auto-process] Failed to transcribe session "${session.title}":`, e);
        }
      }

      // Step 4: Also find sessions with transcription but no summary
      const pendingSummary = updatedSessions.filter(
        (s) => s.transcription && !s.ai_summary
      );
      for (const session of pendingSummary) {
        try {
          await supabase.functions.invoke('summarize-meeting', { body: { sessionId: session.id } });
        } catch (e) {
          console.warn(`[auto-process] Failed to summarize session "${session.title}":`, e);
        }
      }

      if (syncedCount > 0 || pendingTranscription.length > 0 || pendingSummary.length > 0) {
        // Refresh after processing
        await fetchSessions();
        if (syncedCount > 0) toast.success(`${syncedCount} gravação(ões) sincronizada(s) automaticamente`);
        if (pendingTranscription.length > 0) toast.info(`Transcrição e resumo gerados para ${pendingTranscription.length} reunião(ões)`);
      }
    } catch (e) {
      console.warn('[auto-process] Error during auto-processing:', e);
    } finally {
      setAutoProcessing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    autoProcess();
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    try {
      if (selectedSession) {
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

  const syncRecordings = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-meet-recordings', {
        body: { clientId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${data.synced} gravação(ões) sincronizada(s) de ${data.total} sessões`);
      fetchSessions();
    } catch (error: any) {
      console.error('Error syncing recordings:', error);
      toast.error(error.message || 'Erro ao sincronizar gravações');
    } finally {
      setSyncing(false);
    }
  };

  const transcribeSession = async (sessionId: string, force = false) => {
    setTranscribing(sessionId);
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session?.recording_drive_id && !session?.recording_url) {
        toast.error('Nenhuma gravação vinculada a esta sessão');
        return;
      }
      const { data, error } = await supabase.functions.invoke('transcribe-recording', {
        body: {
          userId: user?.id,
          sessionId,
          fileId: session.recording_drive_id,
          fileName: session.recording_drive_id ? undefined : session.recording_url?.split('/').pop(),
          force,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(force ? 'Retranscrição concluída com nova gravação!' : 'Transcrição concluída!');
      fetchSessions();
    } catch (error: any) {
      console.error('Error transcribing:', error);
      toast.error(error.message || 'Erro ao transcrever reunião');
    } finally {
      setTranscribing(null);
    }
  };

  const summarizeSession = async (sessionId: string) => {
    setSummarizing(sessionId);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-meeting', {
        body: { sessionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Resumo gerado com sucesso!');
      fetchSessions();
    } catch (error: any) {
      console.error('Error summarizing:', error);
      toast.error(error.message || 'Erro ao gerar resumo');
    } finally {
      setSummarizing(null);
    }
  };

  const batchImportTranscripts = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('batch-import-transcripts', {
        body: { clientId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Process any pending recordings returned by batch-import
      const pendingRecordings: Array<{ sessionId: string; fileId: string; fileName?: string; sessionTitle: string }> =
        data.pending_recordings || [];

      if (pendingRecordings.length > 0) {
        toast.info(`Iniciando transcrição de ${pendingRecordings.length} gravação(ões)...`);
        let successCount = 0;
        for (let i = 0; i < pendingRecordings.length; i++) {
          const rec = pendingRecordings[i];
          toast.info(`Transcrevendo reunião ${i + 1} de ${pendingRecordings.length}: "${rec.sessionTitle}"`);
          try {
            const { data: tData, error: tError } = await supabase.functions.invoke('transcribe-recording', {
              body: {
                userId: user?.id,
                sessionId: rec.sessionId,
                fileId: rec.fileId,
                fileName: rec.fileName,
                force: false,
              },
            });
            if (!tError && !tData?.error) {
              successCount++;
            } else {
              console.warn(`[batchImport] Failed for "${rec.sessionTitle}":`, tError || tData?.error);
            }
          } catch (e) {
            console.warn(`[batchImport] Exception for "${rec.sessionTitle}":`, e);
          }
        }
        toast.success(`${successCount} de ${pendingRecordings.length} reunião(ões) transcritas e resumidas!`);
        fetchSessions();
      } else if (data.transcriptions > 0 || data.summaries > 0) {
        toast.success(
          `${data.transcriptions} transcrição(ões) importada(s), ${data.summaries} resumo(s) gerado(s)`
        );
        fetchSessions();
      } else {
        toast.info('Nenhuma transcrição nova encontrada. Verifique se as gravações foram sincronizadas.');
      }
    } catch (error: any) {
      console.error('Error importing transcripts:', error);
      toast.error(error.message || 'Erro ao importar transcrições');
    } finally {
      setImporting(false);
    }
  };

  const renderMarkdown = (text: string) =>
    text
      .replace(/^### (.*)/gm, '<h4 class="font-semibold mt-3 mb-1 text-base">$1</h4>')
      .replace(/^## (.*)/gm, '<h3 class="font-bold mt-4 mb-2 text-lg">$1</h3>')
      .replace(/^- (.*)/gm, '<li class="ml-4">$1</li>')
      .replace(/(<li[^>]*>.*<\/li>\n?)+/gs, '<ul class="list-disc mb-2">$&</ul>')
      .replace(/<\/ul>\s*<ul[^>]*>/g, '')
      .replace(/\n/g, '<br/>');

  return (
    <>
      {/* Dedicated AI Summary Dialog */}
      <Dialog open={!!summaryDialogSession} onOpenChange={(open) => !open && setSummaryDialogSession(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Resumo da Reunião
            </DialogTitle>
            {summaryDialogSession && (
              <DialogDescription>
                {summaryDialogSession.title} — {format(new Date(summaryDialogSession.session_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {summaryDialogSession.summary_generated_at && (
                  <span className="ml-2 text-xs">
                    (gerado em {format(new Date(summaryDialogSession.summary_generated_at), "dd/MM/yyyy HH:mm")})
                  </span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
          {summaryDialogSession?.ai_summary && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(summaryDialogSession.ai_summary) }}
            />
          )}
        </DialogContent>
      </Dialog>

    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Reuniões de Consultoria
              {autoProcessing && (
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sincronizando e processando...
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Gerencie as sessões, gravações e resumos de reunião
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={batchImportTranscripts} disabled={importing || autoProcessing}>
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Importar Transcrições e Resumos
            </Button>
            <Button variant="outline" onClick={syncRecordings} disabled={syncing || autoProcessing}>
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Sincronizar Gravações
            </Button>
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

                  {/* AI Summary (read-only) */}
                  {selectedSession?.ai_summary && (
                    <div>
                      <Label className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-500" />
                        Resumo Gerado por IA
                      </Label>
                      <div className="mt-1 p-3 rounded-md bg-muted border text-sm prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{
                          __html: selectedSession.ai_summary
                            .replace(/^### (.*)/gm, '<h4>$1</h4>')
                            .replace(/^## (.*)/gm, '<h3>$1</h3>')
                            .replace(/^- (.*)/gm, '<li>$1</li>')
                            .replace(/\n\n/g, '<br/>')
                        }} />
                      </div>
                    </div>
                  )}

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
              <div key={session.id} className="border rounded-lg overflow-hidden">
                {/* Session header - clickable to edit */}
                <div
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => openEditDialog(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{session.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(session.session_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {session.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          {session.session_type === "online" ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          {sessionTypeLabels[session.session_type]}
                        </span>
                      </div>
                      {session.summary && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{session.summary}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {session.recording_url && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                          <Video className="w-3 h-3 mr-1" />
                          Gravação
                        </Badge>
                      )}
                      {session.transcription && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          <FileAudio className="w-3 h-3 mr-1" />
                          Transcrição
                        </Badge>
                      )}
                      {session.ai_summary && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900"
                          onClick={(e) => { e.stopPropagation(); setSummaryDialogSession(session); }}
                          title="Clique para ver o resumo completo"
                        >
                          <Brain className="w-3 h-3 mr-1" />
                          Resumo IA
                        </Badge>
                      )}
                      {session.notes && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          Ata
                        </Badge>
                      )}
                      <Select
                        value={session.status}
                        onValueChange={(value) => updateSessionStatus(session.id, value)}
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

                {/* Recording, Transcription & Summary section */}
                {(session.recording_url || session.transcription || session.ai_summary || session.status === 'completed') && (
                  <div className="border-t px-4 py-3 bg-muted/30 space-y-3">
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {session.recording_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(session.recording_url!, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Assistir Gravação
                        </Button>
                      )}
                      {session.recording_drive_id && !session.transcription && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => transcribeSession(session.id, false)}
                          disabled={transcribing === session.id}
                        >
                          {transcribing === session.id
                            ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            : <FileAudio className="w-3 h-3 mr-1" />}
                          Transcrever
                        </Button>
                      )}
                      {session.recording_drive_id && session.transcription && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => transcribeSession(session.id, true)}
                          disabled={transcribing === session.id}
                          title="Descarta a transcrição atual e reprocessa a partir da gravação real"
                        >
                          {transcribing === session.id
                            ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            : <RotateCcw className="w-3 h-3 mr-1" />}
                          Retranscrever
                        </Button>
                      )}
                      {session.transcription && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => summarizeSession(session.id)}
                          disabled={summarizing === session.id}
                        >
                          {summarizing === session.id
                            ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            : <Brain className="w-3 h-3 mr-1" />}
                          {session.ai_summary ? "Regenerar Resumo" : "Gerar Resumo IA"}
                        </Button>
                      )}
                    </div>

                    {/* AI Summary */}
                    {session.ai_summary && (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:underline">
                          <Brain className="w-4 h-4" />
                          Resumo gerado pela IA
                          <ChevronDown className="w-4 h-4" />
                          {session.summary_generated_at && (
                            <span className="text-xs text-muted-foreground font-normal">
                              ({format(new Date(session.summary_generated_at), "dd/MM/yyyy HH:mm")})
                            </span>
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 p-3 rounded-md bg-background border text-sm prose prose-sm dark:prose-invert max-w-none">
                          <div dangerouslySetInnerHTML={{
                            __html: session.ai_summary
                              .replace(/^### (.*)/gm, '<h4>$1</h4>')
                              .replace(/^## (.*)/gm, '<h3>$1</h3>')
                              .replace(/^- (.*)/gm, '<li>$1</li>')
                              .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
                              .replace(/<\/ul>\s*<ul>/g, '')
                              .replace(/\n/g, '<br/>')
                          }} />
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Transcription */}
                    {session.transcription && (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline">
                          <FileAudio className="w-4 h-4" />
                          Transcrição completa
                          <ChevronDown className="w-4 h-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 p-3 rounded-md bg-background border text-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
                          {session.transcription}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
