import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  Wand2,
  RefreshCw,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CONSULTING_FEATURES } from "@/data/consultingFeatures";

interface ConsultingClient {
  id: string;
  full_name: string;
  email: string;
  office_name: string;
  num_lawyers: number;
  num_employees: number;
  practice_areas: string | null;
  ai_familiarity_level: string | null;
  tasks_to_automate?: string | null;
  case_management_system?: string | null;
  selected_features: number[] | null;
  custom_features?: string | null;
  generated_prompt: string | null;
}

interface PromptGeneratorProps {
  client: ConsultingClient;
  onUpdate: () => void;
}

export function PromptGenerator({ client, onUpdate }: PromptGeneratorProps) {
  const [prompt, setPrompt] = useState(client.generated_prompt || "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePrompt = async () => {
    setGenerating(true);
    try {
      const selectedFeatureNames = (client.selected_features || [])
        .map(id => CONSULTING_FEATURES.find(f => f.id === id))
        .filter(Boolean)
        .map(f => `- ${f?.name}: ${f?.description}`);

      const systemPrompt = `Você é um especialista em criar prompts detalhados para o Lovable.dev criar sistemas de intranet para escritórios de advocacia. Crie um prompt completo e detalhado em português brasileiro.`;

      const userPrompt = `Crie um prompt detalhado para o Lovable.dev criar uma intranet personalizada para o seguinte escritório de advocacia:

**Informações do Escritório:**
- Nome: ${client.office_name}
- Número de advogados: ${client.num_lawyers}
- Número de colaboradores: ${client.num_employees}
- Áreas de atuação: ${client.practice_areas || 'Não informado'}
- Sistema de gestão atual: ${(client as any).case_management_system || 'Não informado'}

**Nível de familiaridade com IA:** ${client.ai_familiarity_level || 'Iniciante'}

**Tarefas a automatizar:** ${(client as any).tasks_to_automate || 'Não informado'}

**Funcionalidades selecionadas:**
${selectedFeatureNames.length > 0 ? selectedFeatureNames.join('\n') : 'Nenhuma funcionalidade específica selecionada'}

${client.custom_features ? `**Funcionalidades personalizadas:**\n${client.custom_features}` : ''}

O prompt deve ser completo, prático e pronto para ser usado diretamente no Lovable.dev. Inclua especificações técnicas detalhadas, fluxos de trabalho, e requisitos de UI/UX. Use o português brasileiro.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar prompt");
      }

      const data = await response.json();
      const generatedPrompt = data.choices?.[0]?.message?.content || "";
      
      setPrompt(generatedPrompt);
      
      // Save to database
      const { error: updateError } = await supabase
        .from('consulting_clients')
        .update({ generated_prompt: generatedPrompt })
        .eq('id', client.id);

      if (updateError) {
        console.error("Error saving prompt:", updateError);
        toast.error("Prompt gerado, mas erro ao salvar no banco");
      } else {
        toast.success("Prompt gerado e salvo com sucesso!");
        onUpdate();
      }
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast.error("Erro ao gerar prompt");
    } finally {
      setGenerating(false);
    }
  };

  const savePrompt = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('consulting_clients')
        .update({ generated_prompt: prompt })
        .eq('id', client.id);

      if (error) throw error;
      toast.success("Prompt salvo com sucesso!");
      onUpdate();
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Erro ao salvar prompt");
    } finally {
      setSaving(false);
    }
  };

  const copyPrompt = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Prompt para o Lovable
            </CardTitle>
            <CardDescription>
              Gere e edite o prompt personalizado para criar a intranet do cliente
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={generatePrompt} 
              disabled={generating}
              variant={prompt ? "outline" : "default"}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : prompt ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerar
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Gerar com IA
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!prompt && !generating ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum prompt gerado ainda</h3>
            <p className="text-sm mb-4 max-w-md mx-auto">
              Clique no botão "Gerar com IA" para criar um prompt personalizado 
              baseado nas informações do cliente.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info box */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm">
                <strong>Dica:</strong> O prompt abaixo será exibido automaticamente no dashboard do cliente. 
                Você pode editar o texto manualmente antes de salvar.
              </p>
            </div>

            {/* Editable prompt */}
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="O prompt será gerado aqui..."
              className="min-h-[400px] font-mono text-sm"
            />

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {prompt.length} caracteres
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={copyPrompt}
                  disabled={!prompt}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button
                  onClick={savePrompt}
                  disabled={saving || !prompt}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}