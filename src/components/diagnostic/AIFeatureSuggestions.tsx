import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Lightbulb, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CONSULTING_FEATURES, ConsultingFeature } from "@/data/consultingFeatures";

interface AIFeatureSuggestionsProps {
  formData: {
    practice_areas: string;
    num_lawyers: number;
    num_employees: number;
    case_management_system: string;
    tasks_to_automate: string;
    ai_familiarity_level: string;
  };
  selectedFeatures: number[];
  onSelectFeature: (featureId: number) => void;
}

interface Suggestion {
  featureId: number;
  reason: string;
}

export function AIFeatureSuggestions({ 
  formData, 
  selectedFeatures, 
  onSelectFeature 
}: AIFeatureSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [customQuery, setCustomQuery] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateSuggestions = async (query?: string) => {
    setIsLoading(true);
    
    try {
      const systemPrompt = `Você é um consultor especializado em tecnologia jurídica e inteligência artificial para escritórios de advocacia.
Sua tarefa é analisar o perfil do escritório e sugerir funcionalidades que mais agregariam valor.

IMPORTANTE: Você deve retornar um JSON válido no formato:
{
  "suggestions": [
    { "featureId": número, "reason": "razão breve" }
  ]
}

Lista de funcionalidades disponíveis (id - nome - descrição):
${CONSULTING_FEATURES.map(f => `${f.id} - ${f.name} - ${f.description}`).join('\n')}

Regras:
1. Sugira entre 5 e 10 funcionalidades
2. Priorize funcionalidades que resolvam problemas específicos do escritório
3. Considere o tamanho da equipe e nível de familiaridade com IA
4. NÃO sugira funcionalidades já selecionadas: [${selectedFeatures.join(', ')}]
5. A razão deve ser específica para o escritório (máximo 2 frases)`;

      const userPrompt = `Perfil do Escritório:
- Áreas de atuação: ${formData.practice_areas || 'Não informado'}
- Número de advogados: ${formData.num_lawyers}
- Número de funcionários: ${formData.num_employees}
- Sistema de gestão atual: ${formData.case_management_system || 'Não informado'}
- Nível de familiaridade com IA: ${formData.ai_familiarity_level || 'Não informado'}
- Tarefas que deseja automatizar: ${formData.tasks_to_automate || 'Não informado'}

${query ? `Solicitação específica do cliente: ${query}` : 'Sugira funcionalidades que mais agregariam valor para este escritório.'}

Retorne apenas o JSON com as sugestões.`;

      const { data, error } = await supabase.functions.invoke('generate-consulting-prompt', {
        body: { systemPrompt, userPrompt }
      });

      if (error) throw error;

      // Parse the response
      const responseText = data.prompt || data;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const validSuggestions = parsed.suggestions?.filter((s: Suggestion) => 
          CONSULTING_FEATURES.find(f => f.id === s.featureId) && 
          !selectedFeatures.includes(s.featureId)
        ) || [];
        
        setSuggestions(validSuggestions);
        setHasGenerated(true);
        
        if (validSuggestions.length === 0) {
          toast.info("Não encontrei sugestões adicionais. Tente descrever mais sobre suas necessidades.");
        }
      } else {
        throw new Error("Resposta inválida da IA");
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Erro ao gerar sugestões. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureById = (id: number): ConsultingFeature | undefined => {
    return CONSULTING_FEATURES.find(f => f.id === id);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Assistente IA para Sugestões
        </CardTitle>
        <CardDescription>
          Deixe a IA analisar seu escritório e sugerir funcionalidades ideais para você
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom Query Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Descreva suas necessidades específicas ou desafios que enfrenta no dia a dia...

Exemplos:
• Preciso reduzir o tempo gasto com elaboração de contratos
• Quero melhorar o atendimento aos clientes
• Tenho dificuldade em controlar prazos processuais"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Generate Button */}
        <div className="flex gap-2">
          <Button 
            onClick={() => generateSuggestions(customQuery)}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4" />
                {hasGenerated ? "Gerar Novas Sugestões" : "Obter Sugestões da IA"}
              </>
            )}
          </Button>
          
          {customQuery && (
            <Button
              variant="outline"
              onClick={() => {
                setCustomQuery("");
                generateSuggestions();
              }}
              disabled={isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Sugestões personalizadas para seu escritório:
            </h4>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {suggestions.map((suggestion) => {
                  const feature = getFeatureById(suggestion.featureId);
                  if (!feature) return null;
                  
                  const isSelected = selectedFeatures.includes(feature.id);
                  
                  return (
                    <Card 
                      key={feature.id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        isSelected ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : ''
                      }`}
                      onClick={() => onSelectFeature(feature.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-sm">{feature.name}</h5>
                              <Badge variant="outline" className="text-xs">
                                {feature.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                            <p className="text-xs text-primary mt-2 italic">
                              💡 {suggestion.reason}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                +
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Initial State */}
        {!hasGenerated && !isLoading && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Clique no botão acima para a IA analisar seu perfil</p>
            <p>e sugerir as melhores funcionalidades para seu escritório</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
