import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Copy, 
  Check, 
  ExternalLink,
  Target,
  Layers,
  CheckCircle2,
  Circle,
  Rocket,
  Clock,
  AlertCircle,
  Link,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepChecklist } from "./StepChecklist";

// Priority type
type Priority = 'alta' | 'media' | 'baixa';

// Checklist state
interface ChecklistState {
  copiouPrompt: boolean;
  colou: boolean;
  aguardouGeracao: boolean;
  verificouFuncionalidades: boolean;
  testouFuncionalidades: boolean;
}

// Etapa structure
interface EtapaPrompt {
  id: number;
  titulo: string;
  descricao: string;
  prompt: string;
  categoria: string;
  prioridade: Priority;
  funcionalidades: string[];
  ordem: number;
  concluida?: boolean;
  data_conclusao?: string;
  checklist?: ChecklistState;
  checklist_completo?: boolean;
  screenshot_url?: string;
}

interface ImplementationStepsManagerProps {
  clientId: string;
  clientName: string;
}

const getPriorityLabel = (priority: Priority) => {
  switch (priority) {
    case 'alta': return '🔴 Alta';
    case 'media': return '🟡 Média';
    case 'baixa': return '🟢 Baixa';
  }
};

const getPriorityBadgeClass = (priority: Priority) => {
  switch (priority) {
    // Use semantic tokens so the client/admin views stay readable regardless of theme.
    case 'alta': return 'bg-destructive/15 text-destructive border border-destructive/25';
    case 'media': return 'bg-warning/15 text-warning border border-warning/25';
    case 'baixa': return 'bg-success/15 text-success border border-success/25';
  }
};

const getCategoryIcon = (categoria: string) => {
  const icons: Record<string, string> = {
    'base': '🏗️',
    'Documentos': '📄',
    'IA': '🤖',
    'Jurídico': '⚖️',
    'Comunicação': '💬',
    'Gestão': '📊',
    'Financeiro': '💰',
    'RH': '👥',
    'Utilidades': '🛠️',
    'Segurança': '🔐',
    'Integrações': '🔗',
  };
  return icons[categoria] || '📦';
};

// Lovable referral link
const LOVABLE_REFERRAL = "?via=rafaelegg";

interface ClientData {
  phone: string;
  email: string;
  office_name: string;
  lovable_project_url?: string;
}

export function ImplementationStepsManager({ clientId, clientName }: ImplementationStepsManagerProps) {
  const [etapas, setEtapas] = useState<EtapaPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [projectUrl, setProjectUrl] = useState<string | null>(null);

  useEffect(() => {
    loadEtapas();
  }, [clientId]);

  const loadEtapas = async () => {
    try {
      const { data, error } = await supabase
        .from('consulting_clients')
        .select('fragmented_prompts, phone, email, office_name, lovable_project_url')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      
      if (data?.fragmented_prompts && Array.isArray(data.fragmented_prompts)) {
        setEtapas(data.fragmented_prompts as unknown as EtapaPrompt[]);
      }
      
      // Store client data for notifications
      setClientData({
        phone: data?.phone || '',
        email: data?.email || '',
        office_name: data?.office_name || '',
        lovable_project_url: data?.lovable_project_url || undefined
      });
      
      // Set project URL if exists
      if (data?.lovable_project_url) {
        setProjectUrl(data.lovable_project_url);
      }
    } catch (error) {
      console.error("Error loading etapas:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = (etapa: EtapaPrompt) => {
    navigator.clipboard.writeText(etapa.prompt);
    setCopiedId(etapa.id);
    toast.success("Prompt copiado! Cole no Lovable.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openInLovable = (etapa: EtapaPrompt) => {
    const encodedPrompt = encodeURIComponent(etapa.prompt);
    
    // For step 1, use referral link to create new project
    // For subsequent steps, if we have a project URL, add prompt to existing project
    if (etapa.ordem === 1 || !projectUrl) {
      // First step or no project URL - create new project with referral
      // Correct URL format: https://lovable.dev?via=rafaelegg&autosubmit=true#prompt=...
      const url = `https://lovable.dev${LOVABLE_REFERRAL}&autosubmit=true#prompt=${encodedPrompt}`;
      window.open(url, '_blank');
      toast.success("Abrindo Lovable... Aguarde a geração automática.", {
        description: "Após criar o projeto, salve a URL para continuar as próximas etapas."
      });
    } else {
      // Subsequent steps - add to existing project
      let cleanUrl = projectUrl.trim();
      
      // Remove trailing slash
      if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.slice(0, -1);
      }
      
      // Validate Lovable URL
      if (!cleanUrl.includes('lovable.dev') && !cleanUrl.includes('lovable.app')) {
        toast.error("URL do projeto inválida", {
          description: "Verifique se é uma URL do Lovable (lovable.dev ou lovable.app)."
        });
        return;
      }
      
      // Build URL with proper separator
      const separator = cleanUrl.includes('?') ? '&' : '?';
      const url = `${cleanUrl}${separator}autosubmit=true#prompt=${encodedPrompt}`;
      window.open(url, '_blank');
      toast.success("Abrindo seu projeto existente...", {
        description: "O prompt será adicionado ao mesmo projeto."
      });
    }
  };

  const saveProjectUrl = async (url: string) => {
    try {
      const { error } = await supabase
        .from('consulting_clients')
        .update({ lovable_project_url: url })
        .eq('id', clientId);

      if (error) throw error;
      setProjectUrl(url);
      toast.success("URL do projeto salva com sucesso!");
    } catch (error) {
      console.error("Error saving project URL:", error);
      toast.error("Erro ao salvar URL do projeto");
    }
  };

  const sendStepCompletionNotification = async (etapa: EtapaPrompt, nextEtapa?: EtapaPrompt) => {
    if (!clientData?.phone) {
      console.log("No phone number for client, skipping notification");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('notify-step-completed', {
        body: {
          clientId,
          clientName,
          clientPhone: clientData.phone,
          completedStep: etapa.ordem,
          completedStepTitle: etapa.titulo,
          totalSteps: etapas.length,
          nextStepTitle: nextEtapa?.titulo || null,
          nextStepOrder: nextEtapa?.ordem || null
        }
      });

      if (error) {
        console.error("Error sending step notification:", error);
      } else {
        console.log("Step completion notification sent successfully");
      }
    } catch (error) {
      console.error("Error invoking notify-step-completed:", error);
    }
  };

  const saveChecklistState = async (
    etapaId: number, 
    checklist: ChecklistState, 
    screenshotUrl?: string
  ) => {
    const updatedEtapas = etapas.map(e => 
      e.id === etapaId 
        ? { 
            ...e, 
            checklist,
            checklist_completo: Object.values(checklist).every(Boolean),
            screenshot_url: screenshotUrl
          } 
        : e
    );
    
    const { error } = await supabase
      .from('consulting_clients')
      .update({ fragmented_prompts: JSON.parse(JSON.stringify(updatedEtapas)) })
      .eq('id', clientId);

    if (error) {
      console.error("Error saving checklist:", error);
      return;
    }

    setEtapas(updatedEtapas);
  };

  const toggleEtapaConcluida = async (etapaId: number) => {
    const now = new Date().toISOString();
    const etapaAtual = etapas.find(e => e.id === etapaId);
    const isBeingCompleted = etapaAtual && !etapaAtual.concluida;

    // Validate checklist is complete before marking as done
    if (isBeingCompleted && etapaAtual) {
      const isChecklistComplete = etapaAtual.checklist && 
        Object.values(etapaAtual.checklist).every(Boolean);
      
      if (!isChecklistComplete) {
        toast.error("Complete o checklist antes de marcar como concluída");
        return;
      }
    }
    
    const updatedEtapas = etapas.map(e => 
      e.id === etapaId 
        ? { 
            ...e, 
            concluida: !e.concluida,
            data_conclusao: !e.concluida ? now : undefined
          } 
        : e
    );
    
    const { error } = await supabase
      .from('consulting_clients')
      .update({ fragmented_prompts: JSON.parse(JSON.stringify(updatedEtapas)) })
      .eq('id', clientId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    setEtapas(updatedEtapas);
    const etapa = updatedEtapas.find(e => e.id === etapaId);
    toast.success(etapa?.concluida ? "Etapa marcada como concluída! 🎉" : "Etapa desmarcada");
    
    // Send WhatsApp notification when step is completed
    if (isBeingCompleted && etapaAtual) {
      const nextEtapa = updatedEtapas
        .filter(e => !e.concluida)
        .sort((a, b) => a.ordem - b.ordem)[0];
      
      sendStepCompletionNotification(etapaAtual, nextEtapa);

      // Scroll to next incomplete step after state update
      if (nextEtapa) {
        setTimeout(() => {
          const nextEl = document.querySelector(`[data-step-id="${nextEtapa.id}"]`);
          nextEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  };

  const completedCount = etapas.filter(e => e.concluida).length;
  const progressPercent = etapas.length > 0 ? (completedCount / etapas.length) * 100 : 0;

  // Find the next step to do
  const nextStep = etapas.find(e => !e.concluida);

  // Sort: incomplete first, then complete
  const sortedEtapas = [...etapas].sort((a, b) => {
    if (a.concluida === b.concluida) return a.ordem - b.ordem;
    return a.concluida ? 1 : -1;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p>Carregando etapas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (etapas.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Nenhuma etapa gerada ainda</h3>
            <p className="text-sm max-w-md mx-auto">
              As etapas de implementação serão geradas pelo seu consultor 
              com base nas funcionalidades que você selecionou no diagnóstico.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Implementação da Sua Intranet
          </CardTitle>
          <CardDescription>
            Siga as etapas abaixo para construir sua intranet personalizada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{completedCount} de {etapas.length} etapas concluídas</span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
            
            {/* Project URL Section */}
            <div className="border-t pt-4">
              <Label htmlFor="projectUrl" className="flex items-center gap-2 text-sm font-medium mb-2">
                <Link className="w-4 h-4" />
                URL do Projeto no Lovable
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Após criar seu projeto na Etapa 1, cole a URL aqui para que as próximas etapas sejam adicionadas ao mesmo projeto.
              </p>
              <div className="flex gap-2">
                <Input
                  id="projectUrl"
                  placeholder="https://lovable.dev/projects/seu-projeto"
                  value={projectUrl || ''}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => projectUrl && saveProjectUrl(projectUrl)}
                  disabled={!projectUrl}
                  size="sm"
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
              </div>
              {projectUrl && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  URL salva! As próximas etapas serão adicionadas a este projeto.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explanation Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-primary mt-0.5" />
              <div>
                <h3 className="font-bold text-lg">🎯 POR QUE SEU PROJETO FOI DIVIDIDO EM ETAPAS?</h3>
                <p className="text-muted-foreground mt-1">
                  Para garantir a melhor qualidade de implementação, dividimos seu projeto em <strong>{etapas.length} etapas</strong> organizadas por prioridade e categoria.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  BENEFÍCIOS:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                  <li>• Cada etapa é processada completamente pelo Lovable</li>
                  <li>• Você acompanha o progresso gradualmente</li>
                  <li>• Funcionalidades mais importantes são implementadas primeiro</li>
                  <li>• Menor chance de erros e retrabalho</li>
                  <li>• Você pode testar cada módulo antes de avançar</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  COMO FUNCIONA:
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal list-inside">
                  <li>Implemente as etapas na ordem apresentada</li>
                  <li>Copie e cole cada prompt no Lovable</li>
                  <li>Aguarde a geração completa antes de avançar</li>
                  <li>Marque a etapa como concluída</li>
                  <li>Passe para a próxima etapa</li>
                </ol>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-lg font-semibold text-primary">Vamos começar! 🚀</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps List */}
      <ScrollArea className="h-[600px] pr-4">
        <Accordion type="single" collapsible className="space-y-3">
          {sortedEtapas.map((etapa) => {
            const isNextStep = nextStep?.id === etapa.id;
            // data-step-id is used for scrollIntoView after completing a step
            const isCompleted = etapa.concluida;
            
            return (
              <AccordionItem 
                key={etapa.id} 
                value={`etapa-${etapa.id}`}
                className={`rounded-lg overflow-hidden bg-card border ${
                  isCompleted
                    ? 'border-success/35'
                    : isNextStep
                      ? 'border-info/35 ring-2 ring-info/25'
                      : 'border-border'
                }`}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          ETAPA {etapa.ordem}: {etapa.titulo}
                        </span>
                        {isNextStep && !isCompleted && (
                          <Badge className="bg-info text-info-foreground text-xs">Próxima</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{getCategoryIcon(etapa.categoria)} {etapa.categoria}</span>
                        <span>•</span>
                        <Badge className={`text-xs ${getPriorityBadgeClass(etapa.prioridade)}`}>
                          {getPriorityLabel(etapa.prioridade).replace(/🔴|🟡|🟢 /g, '')}
                        </Badge>
                        <span>•</span>
                        <span>{isCompleted ? '✅ Concluída' : '⏳ Pendente'}</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-medium mb-1">📝 DESCRIÇÃO:</h4>
                      <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">🎯 FUNCIONALIDADES INCLUÍDAS:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {etapa.funcionalidades.map((func, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {func}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prompt */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">📋 PROMPT PARA COPIAR:</h4>
                        <div className="bg-secondary/40 border border-border rounded-lg p-3 max-h-[200px] overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {etapa.prompt}
                        </pre>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        onClick={() => copyPrompt(etapa)}
                        variant={isCompleted ? "outline" : "default"}
                        disabled={isCompleted}
                        className="gap-2"
                      >
                        {copiedId === etapa.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar Prompt
                          </>
                        )}
                      </Button>

                      <Button 
                        onClick={() => openInLovable(etapa)}
                        variant="outline"
                        disabled={isCompleted}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir no Lovable
                      </Button>
                    </div>

                    {/* Alert to save project URL after step 1 */}
                    {etapa.ordem === 1 && !projectUrl && !isCompleted && (
                      <div className="p-3 bg-warning/10 rounded-lg border border-warning/25">
                        <p className="text-sm text-warning flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>
                            <strong>Importante:</strong> Após concluir esta etapa, copie a URL do seu projeto 
                            Lovable e salve no campo no topo da página para que as próximas etapas sejam 
                            adicionadas ao mesmo projeto.
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Step Checklist */}
                    <StepChecklist
                      etapaId={etapa.id}
                      clientId={clientId}
                      isCompleted={isCompleted}
                      savedChecklist={etapa.checklist}
                      savedScreenshotUrl={etapa.screenshot_url}
                      onChecklistComplete={(complete) => {
                        // Handle checklist completion state if needed
                      }}
                      onMarkComplete={() => toggleEtapaConcluida(etapa.id)}
                      onSaveChecklist={(checklist, screenshotUrl) => 
                        saveChecklistState(etapa.id, checklist, screenshotUrl)
                      }
                    />

                    {/* Show completion date if completed */}
                    {etapa.data_conclusao && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        Concluída em {new Date(etapa.data_conclusao).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}