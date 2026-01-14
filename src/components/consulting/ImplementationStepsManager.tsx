import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Priority type
type Priority = 'alta' | 'media' | 'baixa';

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
    case 'alta': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'media': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'baixa': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
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

export function ImplementationStepsManager({ clientId, clientName }: ImplementationStepsManagerProps) {
  const [etapas, setEtapas] = useState<EtapaPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadEtapas();
  }, [clientId]);

  const loadEtapas = async () => {
    try {
      const { data, error } = await supabase
        .from('consulting_clients')
        .select('fragmented_prompts')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      
      if (data?.fragmented_prompts && Array.isArray(data.fragmented_prompts)) {
        setEtapas(data.fragmented_prompts as unknown as EtapaPrompt[]);
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
    const url = `https://lovable.dev/?autosubmit=true#prompt=${encodedPrompt}`;
    window.open(url, '_blank');
    toast.success("Abrindo Lovable... Aguarde a geração automática.");
  };

  const toggleEtapaConcluida = async (etapaId: number) => {
    const now = new Date().toISOString();
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
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{completedCount} de {etapas.length} etapas concluídas</span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
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
            const isCompleted = etapa.concluida;
            
            return (
              <AccordionItem 
                key={etapa.id} 
                value={`etapa-${etapa.id}`}
                className={`border rounded-lg overflow-hidden ${
                  isCompleted 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                    : isNextStep 
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-300 dark:ring-blue-600' 
                      : 'bg-card'
                }`}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          ETAPA {etapa.ordem}: {etapa.titulo}
                        </span>
                        {isNextStep && !isCompleted && (
                          <Badge className="bg-blue-500 text-white text-xs">Próxima</Badge>
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
                      <div className="bg-muted/50 border rounded-lg p-3 max-h-[200px] overflow-y-auto">
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

                    {/* Mark as complete */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Checkbox
                        id={`complete-${etapa.id}`}
                        checked={isCompleted}
                        onCheckedChange={() => toggleEtapaConcluida(etapa.id)}
                      />
                      <label 
                        htmlFor={`complete-${etapa.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        ✅ Marcar como concluída
                      </label>
                      {etapa.data_conclusao && (
                        <span className="text-xs text-muted-foreground">
                          (Concluída em {new Date(etapa.data_conclusao).toLocaleDateString('pt-BR')})
                        </span>
                      )}
                    </div>
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