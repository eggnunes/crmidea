import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  Wand2,
  ChevronRight,
  Rocket,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImplementationStep {
  numero: number;
  titulo: string;
  descricao: string;
  prompt: string;
}

interface ImplementationPlan {
  etapas: ImplementationStep[];
}

interface ImplementationPlanViewerProps {
  clientId: string;
  existingPlan?: ImplementationPlan | null;
  readOnly?: boolean;
  onPlanGenerated?: (plan: ImplementationPlan) => void;
}

export function ImplementationPlanViewer({ 
  clientId, 
  existingPlan,
  readOnly = false,
  onPlanGenerated 
}: ImplementationPlanViewerProps) {
  const [plan, setPlan] = useState<ImplementationPlan | null>(existingPlan || null);
  const [generating, setGenerating] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const getReadableError = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return "Erro desconhecido";
    }
  };

  useEffect(() => {
    if (existingPlan) {
      setPlan(existingPlan);
    }
  }, [existingPlan]);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-implementation-plan", {
        body: { clientId }
      });

      if (error) throw error;
      
      if (data.plan) {
        setPlan(data.plan);
        onPlanGenerated?.(data.plan);
        toast.success("Plano de implementação gerado com sucesso!");
      }
    } catch (error: unknown) {
      console.error("Error generating plan:", error);
      toast.error(`Erro ao gerar plano: ${getReadableError(error)}`);
    } finally {
      setGenerating(false);
    }
  };

  const copyPrompt = (step: ImplementationStep) => {
    navigator.clipboard.writeText(step.prompt);
    setCopiedStep(step.numero);
    toast.success(`Prompt da Etapa ${step.numero} copiado!`);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  if (!plan && readOnly) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum plano de implementação disponível ainda.</p>
          <p className="text-sm mt-2">Após a conclusão do diagnóstico, seu plano será gerado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Plano de Implementação
            </CardTitle>
            <CardDescription>
              {plan 
                ? `${plan.etapas.length} etapas para implementar sua intranet`
                : "Gere um plano personalizado com prompts prontos para o Lovable"
              }
            </CardDescription>
          </div>
          
          {!readOnly && (
            <Button 
              onClick={generatePlan} 
              disabled={generating}
              variant={plan ? "outline" : "default"}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : plan ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerar
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Plano com IA
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!plan ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum plano gerado ainda</h3>
            <p className="text-sm mb-4 max-w-md mx-auto">
              Clique no botão acima para gerar um plano de implementação personalizado 
              com prompts prontos para copiar e colar no Lovable.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Explanatory text about gradual implementation */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Por que a implementação é gradual?
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                A inteligência artificial do Lovable funciona melhor quando recebe instruções em etapas. 
                Se tentarmos implementar tudo de uma vez, podem ocorrer erros ou funcionalidades incompletas.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Como usar:</strong> Copie o prompt de cada etapa na ordem indicada e cole no Lovable. 
                Aguarde a IA terminar a implementação completa antes de passar para a próxima etapa. 
                Isso garante que seu sistema seja construído de forma sólida e sem erros.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">
                Copie cada prompt na ordem e cole no Lovable.dev. Aguarde a implementação de cada etapa antes de passar para a próxima.
              </p>
            </div>

            <ScrollArea className="max-h-[600px]">
              <Accordion type="single" collapsible className="space-y-3">
                {plan.etapas.map((step, index) => (
                  <AccordionItem 
                    key={step.numero} 
                    value={`step-${step.numero}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="secondary" 
                          className="w-8 h-8 rounded-full flex items-center justify-center p-0"
                        >
                          {step.numero}
                        </Badge>
                        <div className="text-left">
                          <p className="font-medium">{step.titulo}</p>
                          <p className="text-xs text-muted-foreground font-normal">
                            {step.descricao}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-3">
                        <div className="relative">
                          <pre className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-x-auto max-h-[300px] overflow-y-auto">
                            {step.prompt}
                          </pre>
                          <Button
                            size="sm"
                            className="absolute top-2 right-2 gap-1"
                            onClick={() => copyPrompt(step)}
                          >
                            {copiedStep === step.numero ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {index < plan.etapas.length - 1 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ChevronRight className="w-4 h-4" />
                            <span>Após implementar esta etapa, prossiga para a próxima</span>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
