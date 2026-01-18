import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { CONSULTING_FEATURES, FEATURE_CATEGORIES } from "@/data/consultingFeatures";

type Priority = 'alta' | 'media' | 'baixa';

const PRIORITY_OPTIONS: { value: Priority; label: string; emoji: string; color: string }[] = [
  { value: 'alta', label: 'Alta', emoji: '🔴', color: 'bg-red-500' },
  { value: 'media', label: 'Média', emoji: '🟡', color: 'bg-yellow-500' },
  { value: 'baixa', label: 'Baixa', emoji: '🟢', color: 'bg-green-500' },
];

interface ConsultingClient {
  id: string;
  selected_features: number[];
  feature_priorities: Record<number, Priority>;
  custom_features: string | null;
  user_id: string;
}

// Helper to safely parse feature priorities from database
const parseFeaturePriorities = (data: unknown): Record<number, Priority> => {
  if (!data || typeof data !== 'object') return {};
  const result: Record<number, Priority> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value === 'alta' || value === 'media' || value === 'baixa') {
      result[Number(key)] = value;
    }
  }
  return result;
};

export function EditFeaturePrioritiesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [clientData, setClientData] = useState<ConsultingClient | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [featurePriorities, setFeaturePriorities] = useState<Record<number, Priority>>({});
  const [customFeatures, setCustomFeatures] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>(
    FEATURE_CATEGORIES.map(c => c.id)
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/consultoria");
        return;
      }
      
      setUser(session.user);
      await loadClientData(session.user.email || "");
    };

    checkAuth();
  }, [navigate]);

  const loadClientData = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("consulting_clients")
        .select("id, selected_features, feature_priorities, custom_features, user_id")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const parsedPriorities = parseFeaturePriorities(data.feature_priorities);
        setClientData({
          ...data,
          feature_priorities: parsedPriorities,
        });
        setSelectedFeatures(data.selected_features || []);
        setFeaturePriorities(parsedPriorities);
        setCustomFeatures(data.custom_features || "");
      }
    } catch (error) {
      console.error("Error loading client data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (featureId: number) => {
    if (selectedFeatures.includes(featureId)) {
      setSelectedFeatures(prev => prev.filter(id => id !== featureId));
      setFeaturePriorities(prev => {
        const { [featureId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setSelectedFeatures(prev => [...prev, featureId]);
      setFeaturePriorities(prev => ({ ...prev, [featureId]: 'media' }));
    }
  };

  const updatePriority = (featureId: number, priority: Priority) => {
    setFeaturePriorities(prev => ({ ...prev, [featureId]: priority }));
  };

  const getPriority = (featureId: number): Priority => {
    return featurePriorities[featureId] || 'media';
  };

  const getPriorityConfig = (priority: Priority) => {
    return PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getCategoryFeatures = (category: string) => {
    return CONSULTING_FEATURES.filter(f => f.category === category);
  };

  const handleSave = async () => {
    if (!clientData) return;
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("consulting_clients")
        .update({
          selected_features: selectedFeatures,
          feature_priorities: featurePriorities,
          custom_features: customFeatures || null,
        })
        .eq("id", clientData.id);

      if (error) throw error;

      toast.success("Prioridades salvas com sucesso!");
      
      // Ask if user wants to regenerate the implementation plan
      setRegenerating(true);
      
      try {
        // Regenerate both prompt and implementation plan using auto-generate function
        const { error: genError, data: genData } = await supabase.functions.invoke("auto-generate-client-plan", {
          body: {
            clientEmail: user?.email,
            consultantId: clientData.user_id,
            regenerate: true,
          },
        });

        if (genError) {
          console.error("Error regenerating:", genError);
          toast.error("Erro ao regenerar plano, mas as prioridades foram salvas");
        } else {
          console.log("Regeneration result:", genData);
          toast.success("Plano de implementação regenerado com sucesso!");
        }
      } catch (genError) {
        console.error("Error in regeneration:", genError);
        toast.error("Erro ao regenerar plano, mas as prioridades foram salvas");
      } finally {
        setRegenerating(false);
      }
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate("/consultoria/dashboard");
      }, 1500);
      
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  // Count features without priority set (default media doesn't count as "not set")
  const featuresWithHighPriority = selectedFeatures.filter(id => featurePriorities[id] === 'alta').length;
  const featuresWithLowPriority = selectedFeatures.filter(id => featurePriorities[id] === 'baixa').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Não foi possível encontrar seu registro de consultoria.
            </p>
            <Button onClick={() => navigate("/consultoria/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/consultoria/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">Editar Prioridades</h1>
              <p className="text-sm text-muted-foreground">Ajuste as prioridades das funcionalidades</p>
            </div>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={saving || regenerating}
            className="gap-2"
          >
            {saving || regenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {regenerating ? "Regenerando plano..." : "Salvando..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar e Regenerar Plano
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                  Defina as prioridades das funcionalidades
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Escolha quais funcionalidades são mais importantes para você. Isso nos ajuda a criar um 
                  plano de implementação personalizado, começando pelas funcionalidades de maior prioridade.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-red-600">{featuresWithHighPriority}</div>
              <p className="text-xs text-muted-foreground">🔴 Alta Prioridade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {selectedFeatures.length - featuresWithHighPriority - featuresWithLowPriority}
              </div>
              <p className="text-xs text-muted-foreground">🟡 Média Prioridade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-green-600">{featuresWithLowPriority}</div>
              <p className="text-xs text-muted-foreground">🟢 Baixa Prioridade</p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Funcionalidades</span>
              <Badge variant="secondary">
                {selectedFeatures.length} selecionada{selectedFeatures.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
            <CardDescription>
              Marque as funcionalidades desejadas e defina a prioridade de cada uma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURE_CATEGORIES.map((category) => {
              const features = getCategoryFeatures(category.id);
              const selectedInCategory = features.filter(f =>
                selectedFeatures.includes(f.id)
              ).length;
              
              return (
                <Collapsible
                  key={category.id}
                  open={openCategories.includes(category.id)}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedInCategory > 0 && (
                        <Badge variant="default" className="text-xs">
                          {selectedInCategory}
                        </Badge>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          openCategories.includes(category.id) ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="pt-2">
                    <div className="grid gap-2 pl-4 border-l-2 border-muted ml-4">
                      {features.map((feature) => {
                        const isSelected = selectedFeatures.includes(feature.id);
                        const priority = getPriority(feature.id);
                        const priorityConfig = getPriorityConfig(priority);
                        
                        return (
                          <div
                            key={feature.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "hover:bg-accent/50"
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleFeature(feature.id)}
                              className="mt-0.5"
                            />
                            <div 
                              className="flex-1 min-w-0"
                              onClick={() => toggleFeature(feature.id)}
                            >
                              <Label className="font-medium cursor-pointer">
                                {feature.name}
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {feature.description}
                              </p>
                            </div>
                            
                            {isSelected && (
                              <div 
                                className="flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Select
                                  value={priority}
                                  onValueChange={(value) => updatePriority(feature.id, value as Priority)}
                                >
                                  <SelectTrigger className="w-[130px] h-8 text-xs">
                                    <SelectValue>
                                      <span className="flex items-center gap-1.5">
                                        <span>{priorityConfig.emoji}</span>
                                        <span>{priorityConfig.label}</span>
                                      </span>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PRIORITY_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        <span className="flex items-center gap-2">
                                          <span>{option.emoji}</span>
                                          <span>{option.label}</span>
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>

        {/* Custom Features */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Funcionalidades Personalizadas</CardTitle>
            <CardDescription>
              Descreva outras funcionalidades que você precisa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={customFeatures}
              onChange={(e) => setCustomFeatures(e.target.value)}
              placeholder="Descreva outras funcionalidades específicas que você precisa e que não estão listadas acima..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Save Button (Mobile) */}
        <div className="mt-6 sticky bottom-4">
          <Button 
            onClick={handleSave} 
            disabled={saving || regenerating}
            className="w-full gap-2"
            size="lg"
          >
            {saving || regenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {regenerating ? "Regenerando plano de implementação..." : "Salvando..."}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Salvar e Regenerar Plano de Implementação
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
