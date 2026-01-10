import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  TrendingUp,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeedbackForm {
  implementation_status: string;
  ai_usage_frequency: string;
  main_challenges: string;
  achievements: string;
  needs_help: boolean;
  help_details: string;
}

interface ProgressFeedback {
  id: string;
  implementation_status: string;
  ai_usage_frequency: string | null;
  main_challenges: string | null;
  achievements: string | null;
  needs_help: boolean;
  help_details: string | null;
  created_at: string;
}

interface Props {
  clientId: string;
  userId: string;
}

const statusOptions = [
  { value: "not_started", label: "Ainda não comecei", icon: XCircle, color: "text-red-500" },
  { value: "in_progress", label: "Em andamento", icon: Clock, color: "text-blue-500" },
  { value: "completed", label: "Implementação concluída", icon: CheckCircle2, color: "text-green-500" },
  { value: "blocked", label: "Travado/Preciso de ajuda", icon: AlertCircle, color: "text-yellow-500" },
];

const frequencyOptions = [
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "rarely", label: "Raramente" },
  { value: "not_using", label: "Ainda não estou usando" },
];

export function ClientProgressFeedback({ clientId, userId }: Props) {
  const [form, setForm] = useState<FeedbackForm>({
    implementation_status: "",
    ai_usage_frequency: "",
    main_challenges: "",
    achievements: "",
    needs_help: false,
    help_details: "",
  });
  const [history, setHistory] = useState<ProgressFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [clientId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("client_progress_feedback")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory((data || []) as ProgressFeedback[]);
    } catch (error) {
      console.error("Error fetching feedback history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.implementation_status) {
      toast.error("Por favor, selecione o status da implementação");
      return;
    }

    setSubmitting(true);
    try {
      // First, get the client name
      const { data: clientData } = await supabase
        .from("consulting_clients")
        .select("full_name")
        .eq("id", clientId)
        .single();

      const { error } = await supabase
        .from("client_progress_feedback")
        .insert({
          client_id: clientId,
          user_id: userId,
          implementation_status: form.implementation_status,
          ai_usage_frequency: form.ai_usage_frequency || null,
          main_challenges: form.main_challenges || null,
          achievements: form.achievements || null,
          needs_help: form.needs_help,
          help_details: form.help_details || null,
        });

      if (error) throw error;

      // Send WhatsApp notification to admin
      try {
        await supabase.functions.invoke("notify-progress-feedback", {
          body: {
            clientId,
            clientName: clientData?.full_name || "Cliente",
            implementationStatus: form.implementation_status,
            achievements: form.achievements,
            mainChallenges: form.main_challenges,
            needsHelp: form.needs_help,
            helpDetails: form.help_details,
          },
        });
      } catch (notifyError) {
        console.error("Error sending notification:", notifyError);
        // Don't fail the whole submission if notification fails
      }

      toast.success("Feedback enviado com sucesso! Obrigado pela atualização.");
      
      // Reset form
      setForm({
        implementation_status: "",
        ai_usage_frequency: "",
        main_challenges: "",
        achievements: "",
        needs_help: false,
        help_details: "",
      });

      // Refresh history
      fetchHistory();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Erro ao enviar feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(o => o.value === status);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <Badge variant="outline" className={`gap-1 ${option.color}`}>
        <Icon className="w-3 h-3" />
        {option.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Form */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Atualização de Progresso
          </CardTitle>
          <CardDescription>
            Conte-nos como está a implementação do sistema de IA no seu escritório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Implementation Status */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Como está a implementação do sistema?</Label>
            <RadioGroup
              value={form.implementation_status}
              onValueChange={(value) => setForm({ ...form, implementation_status: value })}
              className="grid gap-3"
            >
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      form.implementation_status === option.value
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Icon className={`w-5 h-5 ${option.color}`} />
                    <span>{option.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* AI Usage Frequency */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Com que frequência está usando IA no trabalho?</Label>
            <RadioGroup
              value={form.ai_usage_frequency}
              onValueChange={(value) => setForm({ ...form, ai_usage_frequency: value })}
              className="grid grid-cols-2 gap-3"
            >
              {frequencyOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`freq-${option.value}`}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    form.ai_usage_frequency === option.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={`freq-${option.value}`} />
                  <span className="text-sm">{option.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Achievements */}
          <div className="space-y-2">
            <Label htmlFor="achievements" className="text-base font-medium">
              Conquistas e progresso
            </Label>
            <Textarea
              id="achievements"
              value={form.achievements}
              onChange={(e) => setForm({ ...form, achievements: e.target.value })}
              placeholder="Compartilhe suas conquistas, melhorias percebidas, tarefas automatizadas..."
              rows={3}
            />
          </div>

          {/* Challenges */}
          <div className="space-y-2">
            <Label htmlFor="challenges" className="text-base font-medium">
              Principais desafios
            </Label>
            <Textarea
              id="challenges"
              value={form.main_challenges}
              onChange={(e) => setForm({ ...form, main_challenges: e.target.value })}
              placeholder="Quais dificuldades está enfrentando na implementação?"
              rows={3}
            />
          </div>

          {/* Needs Help */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-yellow-500" />
                <div>
                  <Label>Precisa de ajuda urgente?</Label>
                  <p className="text-sm text-muted-foreground">
                    Marque se precisar de uma reunião extra
                  </p>
                </div>
              </div>
              <Switch
                checked={form.needs_help}
                onCheckedChange={(checked) => setForm({ ...form, needs_help: checked })}
              />
            </div>

            {form.needs_help && (
              <Textarea
                value={form.help_details}
                onChange={(e) => setForm({ ...form, help_details: e.target.value })}
                placeholder="Descreva com o que precisa de ajuda..."
                rows={2}
              />
            )}
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Enviar Atualização
          </Button>
        </CardContent>
      </Card>

      {/* Feedback History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Histórico de Atualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {history.map((feedback) => (
                  <div key={feedback.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(feedback.implementation_status)}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    
                    {feedback.achievements && (
                      <div className="text-sm">
                        <span className="font-medium text-green-600">Conquistas:</span>{" "}
                        {feedback.achievements}
                      </div>
                    )}
                    
                    {feedback.main_challenges && (
                      <div className="text-sm">
                        <span className="font-medium text-yellow-600">Desafios:</span>{" "}
                        {feedback.main_challenges}
                      </div>
                    )}
                    
                    {feedback.needs_help && feedback.help_details && (
                      <div className="text-sm bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
                        <span className="font-medium text-yellow-600">Pedido de ajuda:</span>{" "}
                        {feedback.help_details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
