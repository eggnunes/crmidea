import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  Wand2,
  RefreshCw,
  ChevronRight,
  Target,
  Layers,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CONSULTING_FEATURES, FEATURE_CATEGORIES, ConsultingFeature } from "@/data/consultingFeatures";

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
}

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
  feature_priorities?: Record<string, Priority> | null;
  fragmented_prompts?: EtapaPrompt[] | null;
  logo_url?: string | null;
  website?: string | null;
}

interface FragmentedPromptsGeneratorProps {
  client: ConsultingClient;
  onUpdate: () => void;
}

// Category mapping for grouping
const CATEGORY_ORDER = [
  { id: 'base', name: 'Estrutura Base', icon: '🏗️' },
  { id: 'Documentos', name: 'Documentos Jurídicos', icon: '📄' },
  { id: 'IA', name: 'Inteligência Artificial', icon: '🤖' },
  { id: 'Jurídico', name: 'Jurídico e Processual', icon: '⚖️' },
  { id: 'Comunicação', name: 'Atendimento ao Cliente', icon: '💬' },
  { id: 'Gestão', name: 'Gestão e Produtividade', icon: '📊' },
  { id: 'Financeiro', name: 'Financeiro e Comercial', icon: '💰' },
  { id: 'RH', name: 'Recursos Humanos', icon: '👥' },
  { id: 'Utilidades', name: 'Utilidades e Ferramentas', icon: '🛠️' },
  { id: 'Segurança', name: 'Segurança e Administração', icon: '🔐' },
  { id: 'Integrações', name: 'Integrações', icon: '🔗' },
];

const PRIORITY_ORDER: Priority[] = ['alta', 'media', 'baixa'];

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

export function FragmentedPromptsGenerator({ client, onUpdate }: FragmentedPromptsGeneratorProps) {
  const [etapas, setEtapas] = useState<EtapaPrompt[]>((client.fragmented_prompts as EtapaPrompt[]) || []);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client.fragmented_prompts) {
      setEtapas(client.fragmented_prompts as EtapaPrompt[]);
    }
  }, [client.fragmented_prompts]);

  const generateFragmentedPrompts = async () => {
    setGenerating(true);
    try {
      const selectedFeatures = (client.selected_features || [])
        .map(id => CONSULTING_FEATURES.find(f => f.id === id))
        .filter(Boolean) as ConsultingFeature[];

      const featurePriorities = (client.feature_priorities || {}) as Record<string, Priority>;

      // Group features by category and priority
      const featuresByCategory: Record<string, Record<Priority, ConsultingFeature[]>> = {};
      
      selectedFeatures.forEach(feature => {
        const category = feature.category;
        const priority = featurePriorities[feature.id.toString()] || 'media';
        
        if (!featuresByCategory[category]) {
          featuresByCategory[category] = { alta: [], media: [], baixa: [] };
        }
        featuresByCategory[category][priority].push(feature);
      });

      const generatedEtapas: EtapaPrompt[] = [];
      let etapaId = 1;

      // ETAPA 1 - Estrutura Base (always first)
      const basePrompt = await generateBasePrompt(client);
      generatedEtapas.push({
        id: etapaId++,
        titulo: "ESTRUTURA BASE",
        descricao: "Criação da estrutura inicial da intranet com autenticação, dashboard e navegação",
        prompt: basePrompt,
        categoria: "base",
        prioridade: "alta",
        funcionalidades: ["Sistema de autenticação", "Dashboard principal", "Layout responsivo", "Navegação lateral"],
        ordem: 1,
        concluida: false
      });

      // Generate etapas for each priority level
      for (const priority of PRIORITY_ORDER) {
        for (const categoryInfo of CATEGORY_ORDER) {
          if (categoryInfo.id === 'base') continue;
          
          const categoryFeatures = featuresByCategory[categoryInfo.id]?.[priority] || [];
          if (categoryFeatures.length === 0) continue;

          // Split into chunks of 3-5 features
          const chunks = chunkArray(categoryFeatures, 4);
          
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const promptText = await generateFeaturePrompt(client, chunk, categoryInfo.name, priority, chunks.length > 1 ? i + 1 : undefined);
            
            generatedEtapas.push({
              id: etapaId++,
              titulo: `${categoryInfo.name.toUpperCase()}${chunks.length > 1 ? ` (Parte ${i + 1})` : ''}`,
              descricao: `Implementação de ${chunk.length} funcionalidade(s) de ${categoryInfo.name} com prioridade ${getPriorityLabel(priority).replace(/🔴|🟡|🟢 /g, '')}`,
              prompt: promptText,
              categoria: categoryInfo.id,
              prioridade: priority,
              funcionalidades: chunk.map(f => f.name),
              ordem: etapaId - 1,
              concluida: false
            });
          }
        }
      }

      // Save to database - use JSON stringify/parse for JSONB compatibility
      const { error } = await supabase
        .from('consulting_clients')
        .update({ 
          fragmented_prompts: JSON.parse(JSON.stringify(generatedEtapas)),
          generated_prompt: `Projeto dividido em ${generatedEtapas.length} etapas organizadas por prioridade.`
        })
        .eq('id', client.id);

      if (error) throw error;

      setEtapas(generatedEtapas);
      toast.success(`${generatedEtapas.length} etapas geradas com sucesso!`);
      onUpdate();
    } catch (error) {
      console.error("Error generating prompts:", error);
      toast.error("Erro ao gerar etapas de implementação");
    } finally {
      setGenerating(false);
    }
  };

  const generateBasePrompt = async (client: ConsultingClient): Promise<string> => {
    const systemPrompt = `Você é um especialista em criar prompts para o Lovable.dev. Crie um prompt conciso (máximo 5000 caracteres) em português brasileiro para criar a estrutura base de uma intranet.`;
    
    const userPrompt = `Crie um prompt para o Lovable.dev criar a ESTRUTURA BASE de uma intranet para:

**Escritório:** ${client.office_name}
- ${client.num_lawyers} advogado(s)
- ${client.num_employees} funcionário(s)
- Áreas: ${client.practice_areas || 'Não informado'}
${client.website ? `- Website: ${client.website}` : ''}
${client.logo_url ? `- Logo: ${client.logo_url}` : ''}

O prompt deve incluir:
1. Sistema de autenticação de usuários (login/logout)
2. Dashboard principal com navegação lateral
3. Layout responsivo e moderno
4. Tema de cores profissional para escritório de advocacia
5. Estrutura de rotas preparada para futuras funcionalidades

Tecnologias: React, TypeScript, Tailwind CSS, shadcn/ui

O prompt deve ser COMPLETO e prático, pronto para colar no Lovable.dev.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) throw new Error("Erro ao gerar prompt base");
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  };

  const generateFeaturePrompt = async (
    client: ConsultingClient, 
    features: ConsultingFeature[], 
    categoryName: string,
    priority: Priority,
    partNumber?: number
  ): Promise<string> => {
    const systemPrompt = `Você é um especialista em criar prompts para o Lovable.dev. Crie um prompt conciso (máximo 5000 caracteres) em português brasileiro para ADICIONAR funcionalidades a um projeto existente.`;
    
    const featureList = features.map(f => `- ${f.name}: ${f.description}`).join('\n');
    
    const userPrompt = `Crie um prompt para o Lovable.dev ADICIONAR as seguintes funcionalidades de ${categoryName} ao projeto existente da intranet "${client.office_name}":

**Funcionalidades (Prioridade ${getPriorityLabel(priority).replace(/🔴|🟡|🟢 /g, '')}):**
${featureList}

INSTRUÇÕES:
1. O projeto base JÁ EXISTE - não recriar estrutura/autenticação
2. Integrar novas funcionalidades ao dashboard existente
3. Adicionar rotas/páginas necessárias à navegação lateral
4. Manter consistência visual com o projeto
5. Ser específico sobre componentes, estados e fluxos

O prompt deve ser COMPLETO, prático e pronto para colar no Lovable.dev.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) throw new Error(`Erro ao gerar prompt para ${categoryName}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  };

  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const copyPrompt = (etapa: EtapaPrompt) => {
    navigator.clipboard.writeText(etapa.prompt);
    setCopiedId(etapa.id);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditing = (etapa: EtapaPrompt) => {
    setEditingId(etapa.id);
    setEditedPrompt(etapa.prompt);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedPrompt("");
  };

  const saveEditedPrompt = async (etapaId: number) => {
    setSaving(true);
    try {
      const updatedEtapas = etapas.map(e => 
        e.id === etapaId ? { ...e, prompt: editedPrompt } : e
      );
      
      const { error } = await supabase
        .from('consulting_clients')
        .update({ fragmented_prompts: JSON.parse(JSON.stringify(updatedEtapas)) })
        .eq('id', client.id);

      if (error) throw error;

      setEtapas(updatedEtapas);
      setEditingId(null);
      setEditedPrompt("");
      toast.success("Prompt atualizado!");
      onUpdate();
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Erro ao salvar prompt");
    } finally {
      setSaving(false);
    }
  };

  const toggleEtapaConcluida = async (etapaId: number) => {
    const updatedEtapas = etapas.map(e => 
      e.id === etapaId ? { ...e, concluida: !e.concluida } : e
    );
    
    const { error } = await supabase
      .from('consulting_clients')
      .update({ fragmented_prompts: JSON.parse(JSON.stringify(updatedEtapas)) })
      .eq('id', client.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    setEtapas(updatedEtapas);
    const etapa = updatedEtapas.find(e => e.id === etapaId);
    toast.success(etapa?.concluida ? "Etapa marcada como concluída!" : "Etapa desmarcada");
    onUpdate();
  };

  const completedCount = etapas.filter(e => e.concluida).length;
  const progressPercent = etapas.length > 0 ? (completedCount / etapas.length) * 100 : 0;

  // Group etapas by priority for display
  const etapasByPriority = {
    alta: etapas.filter(e => e.prioridade === 'alta'),
    media: etapas.filter(e => e.prioridade === 'media'),
    baixa: etapas.filter(e => e.prioridade === 'baixa')
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Prompts Fragmentados por Prioridade
              </CardTitle>
              <CardDescription>
                Gere etapas de implementação organizadas por prioridade e categoria
              </CardDescription>
            </div>
            
            <Button 
              onClick={generateFragmentedPrompts} 
              disabled={generating}
              variant={etapas.length > 0 ? "outline" : "default"}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando etapas...
                </>
              ) : etapas.length > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerar Etapas
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Gerar Etapas com IA
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Empty State */}
      {etapas.length === 0 && !generating && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-2">Nenhuma etapa gerada ainda</h3>
              <p className="text-sm mb-4 max-w-md mx-auto">
                Clique em "Gerar Etapas com IA" para criar prompts fragmentados 
                baseados nas funcionalidades e prioridades selecionadas pelo cliente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generating State */}
      {generating && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="font-semibold text-lg mb-2">Gerando etapas de implementação...</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Organizando funcionalidades por prioridade e categoria, 
                e gerando prompts otimizados para cada etapa.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapas Display */}
      {etapas.length > 0 && !generating && (
        <>
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
                      <Layers className="w-4 h-4 text-primary" />
                      📋 COMO FUNCIONA:
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
                  <span className="text-lg">Vamos começar! 🚀</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Progresso Geral</span>
                <span className="text-sm text-muted-foreground">
                  {completedCount} de {etapas.length} etapas concluídas
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </CardContent>
          </Card>

          {/* Etapas by Priority */}
          <div className="space-y-4">
            {PRIORITY_ORDER.map(priority => {
              const priorityEtapas = etapasByPriority[priority];
              if (priorityEtapas.length === 0) return null;

              return (
                <Card key={priority}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge className={getPriorityBadgeClass(priority)}>
                        {getPriorityLabel(priority)}
                      </Badge>
                      <span>{priorityEtapas.length} etapa(s)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {priorityEtapas.map((etapa) => (
                        <AccordionItem 
                          key={etapa.id} 
                          value={`etapa-${etapa.id}`}
                          className={`border rounded-lg px-4 ${etapa.concluida ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : ''}`}
                        >
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${etapa.concluida ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'}`}>
                                {etapa.concluida ? <Check className="w-4 h-4" /> : etapa.ordem}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold">Etapa {etapa.ordem}: {etapa.titulo}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {CATEGORY_ORDER.find(c => c.id === etapa.categoria)?.icon || '📌'} {etapa.categoria}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className="space-y-4">
                              {/* Features list */}
                              <div>
                                <h4 className="text-sm font-medium mb-2">Funcionalidades incluídas:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {etapa.funcionalidades.map((f, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {f}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Prompt */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium">Prompt:</h4>
                                  <div className="flex gap-2">
                                    {editingId === etapa.id ? (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={cancelEditing}
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => saveEditedPrompt(etapa.id)}
                                          disabled={saving}
                                          className="gap-1"
                                        >
                                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                          Salvar
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startEditing(etapa)}
                                          className="gap-1"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          Editar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => copyPrompt(etapa)}
                                          className="gap-1"
                                        >
                                          {copiedId === etapa.id ? (
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
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {editingId === etapa.id ? (
                                  <Textarea
                                    value={editedPrompt}
                                    onChange={(e) => setEditedPrompt(e.target.value)}
                                    className="min-h-[300px] font-mono text-sm"
                                  />
                                ) : (
                                  <ScrollArea className="h-[200px] rounded-lg border bg-muted/30 p-3">
                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                      {etapa.prompt}
                                    </pre>
                                  </ScrollArea>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  {etapa.prompt.length} caracteres
                                </div>
                              </div>

                              {/* Mark as completed */}
                              <div className="flex items-center justify-end pt-2 border-t">
                                <Button
                                  variant={etapa.concluida ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => toggleEtapaConcluida(etapa.id)}
                                  className="gap-2"
                                >
                                  {etapa.concluida ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      Concluída ✓
                                    </>
                                  ) : (
                                    <>
                                      <Target className="w-4 h-4" />
                                      Marcar como Concluída
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
