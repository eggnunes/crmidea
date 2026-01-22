import { useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Check, Copy, Layers } from "lucide-react";
import { toast } from "sonner";

type Priority = "alta" | "media" | "baixa";

export interface ClientStep {
  id: number;
  titulo: string;
  descricao: string;
  prompt: string;
  categoria?: string;
  prioridade?: Priority;
  ordem?: number;
  funcionalidades?: string[];
}

interface ClientStepsViewerProps {
  steps: ClientStep[];
}

const getPriorityLabel = (priority?: Priority) => {
  switch (priority) {
    case "alta":
      return "🔴 Alta";
    case "media":
      return "🟡 Média";
    case "baixa":
      return "🟢 Baixa";
    default:
      return null;
  }
};

export function ClientStepsViewer({ steps }: ClientStepsViewerProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const sorted = useMemo(() => {
    return [...(steps || [])].sort((a, b) => (a.ordem ?? a.id) - (b.ordem ?? b.id));
  }, [steps]);

  const copyPrompt = async (step: ClientStep) => {
    try {
      await navigator.clipboard.writeText(step.prompt);
      setCopiedId(step.id);
      toast.success("Prompt copiado!");
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Não foi possível copiar o prompt");
    }
  };

  if (!steps?.length) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-60" />
            <p>Nenhuma etapa disponível ainda.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Prompt por etapas
          </CardTitle>
          <CardDescription>
            Siga as etapas na ordem. Em cada etapa, copie o prompt e cole no Lovable.
          </CardDescription>
        </CardHeader>
      </Card>

      <ScrollArea className="h-[650px] pr-4">
        <Accordion type="single" collapsible className="space-y-3">
          {sorted.map((step) => {
            const priorityLabel = getPriorityLabel(step.prioridade);
            const metaLine = step.categoria
              ? `${step.categoria}${priorityLabel ? ` • ${priorityLabel}` : ""}`
              : priorityLabel;

            return (
              <AccordionItem
                key={step.id}
                value={`step-${step.id}`}
                className="border rounded-lg bg-card"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between gap-4 flex-1 text-left">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {(step.ordem ?? step.id).toString().padStart(2, "0")} — {step.titulo}
                      </div>
                      {metaLine ? (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{metaLine}</div>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        copyPrompt(step);
                      }}
                    >
                      {copiedId === step.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3">
                    {step.descricao ? (
                      <p className="text-sm text-muted-foreground">{step.descricao}</p>
                    ) : null}

                    <pre className="whitespace-pre-wrap break-words text-sm bg-muted/40 border rounded-md p-4">
                      {step.prompt}
                    </pre>
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
