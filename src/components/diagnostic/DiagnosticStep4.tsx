import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { CONSULTING_FEATURES, FEATURE_CATEGORIES } from "@/data/consultingFeatures";
import { AIFeatureSuggestions } from "./AIFeatureSuggestions";
import type { DiagnosticFormData } from "@/pages/PublicDiagnosticForm";

interface DiagnosticStep4Props {
  formData: DiagnosticFormData;
  updateFormData: (updates: Partial<DiagnosticFormData>) => void;
}

type Priority = 'alta' | 'media' | 'baixa';

const PRIORITY_OPTIONS: { value: Priority; label: string; emoji: string; color: string }[] = [
  { value: 'alta', label: 'Alta', emoji: '🔴', color: 'bg-red-500' },
  { value: 'media', label: 'Média', emoji: '🟡', color: 'bg-yellow-500' },
  { value: 'baixa', label: 'Baixa', emoji: '🟢', color: 'bg-green-500' },
];

export function DiagnosticStep4({ formData, updateFormData }: DiagnosticStep4Props) {
  const [openCategories, setOpenCategories] = useState<string[]>(
    FEATURE_CATEGORIES.map(c => c.id)
  );
  
  const toggleFeature = (featureId: number) => {
    const current = formData.selected_features;
    const currentPriorities = formData.feature_priorities || {};
    
    if (current.includes(featureId)) {
      // Remove feature and its priority
      const updated = current.filter((id) => id !== featureId);
      const { [featureId]: _, ...remainingPriorities } = currentPriorities;
      updateFormData({ 
        selected_features: updated,
        feature_priorities: remainingPriorities
      });
    } else {
      // Add feature with default priority "media"
      const updated = [...current, featureId];
      updateFormData({ 
        selected_features: updated,
        feature_priorities: { ...currentPriorities, [featureId]: 'media' as Priority }
      });
    }
  };

  const updatePriority = (featureId: number, priority: Priority) => {
    const currentPriorities = formData.feature_priorities || {};
    updateFormData({
      feature_priorities: { ...currentPriorities, [featureId]: priority }
    });
  };

  const getPriority = (featureId: number): Priority => {
    return formData.feature_priorities?.[featureId] || 'media';
  };

  const getPriorityConfig = (priority: Priority) => {
    return PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];
  };
  
  const toggleCategory = (category: string) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };
  
  const getCategoryFeatures = (category: string) => {
    return CONSULTING_FEATURES.filter((f) => f.category === category);
  };
  
  const selectedCount = formData.selected_features.length;
  
  return (
    <div className="space-y-6">
      {/* Priority Alert */}
      <div className="p-4 rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-700">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-300">
              Importante: Defina a Prioridade de Cada Funcionalidade!
            </h3>
            <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
              Ao selecionar uma funcionalidade, <strong>clique no seletor de prioridade</strong> ao lado dela para definir:
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="inline-flex items-center gap-1.5 text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                🔴 <strong>Alta</strong> - Implementar primeiro
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                🟡 <strong>Média</strong> - Implementar depois
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                🟢 <strong>Baixa</strong> - Pode esperar
              </span>
            </div>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-2">
              💡 As prioridades nos ajudam a criar um plano de implementação personalizado para você!
            </p>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <AIFeatureSuggestions
        formData={{
          practice_areas: formData.practice_areas,
          num_lawyers: formData.num_lawyers,
          num_employees: formData.num_employees,
          case_management_system: formData.case_management_system,
          tasks_to_automate: formData.tasks_to_automate,
          ai_familiarity_level: formData.ai_familiarity_level,
        }}
        selectedFeatures={formData.selected_features}
        onSelectFeature={toggleFeature}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Ou selecione manualmente as funcionalidades desejadas
        </p>
        <Badge variant="secondary">
          {selectedCount} selecionada{selectedCount !== 1 ? "s" : ""}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {FEATURE_CATEGORIES.map((category) => {
          const features = getCategoryFeatures(category.id);
          const selectedInCategory = features.filter((f) =>
            formData.selected_features.includes(f.id)
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
                    const isSelected = formData.selected_features.includes(feature.id);
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
                        
                        {/* Priority Selector - only show when selected */}
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
      </div>
      
      {/* Custom Features */}
      <div className="space-y-2 pt-4 border-t">
        <Label htmlFor="custom_features">
          Outras funcionalidades que você gostaria de implantar
        </Label>
        <Textarea
          id="custom_features"
          value={formData.custom_features}
          onChange={(e) => updateFormData({ custom_features: e.target.value })}
          placeholder="Descreva outras funcionalidades específicas que você precisa e que não estão listadas acima..."
          rows={4}
        />
      </div>
    </div>
  );
}