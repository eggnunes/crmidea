import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { CONSULTING_FEATURES, FEATURE_CATEGORIES } from "@/data/consultingFeatures";
import type { DiagnosticFormData } from "@/pages/PublicDiagnosticForm";

interface DiagnosticStep4Props {
  formData: DiagnosticFormData;
  updateFormData: (updates: Partial<DiagnosticFormData>) => void;
}

export function DiagnosticStep4({ formData, updateFormData }: DiagnosticStep4Props) {
  const [openCategories, setOpenCategories] = useState<string[]>(
    Object.keys(FEATURE_CATEGORIES)
  );
  
  const toggleFeature = (featureId: number) => {
    const current = formData.selected_features;
    const updated = current.includes(featureId)
      ? current.filter((id) => id !== featureId)
      : [...current, featureId];
    updateFormData({ selected_features: updated });
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Selecione as funcionalidades que deseja implantar no seu escritório
        </p>
        <Badge variant="secondary">
          {selectedCount} selecionada{selectedCount !== 1 ? "s" : ""}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {Object.entries(FEATURE_CATEGORIES).map(([key, category]) => {
          const features = getCategoryFeatures(key);
          const selectedInCategory = features.filter((f) =>
            formData.selected_features.includes(f.id)
          ).length;
          
          return (
            <Collapsible
              key={key}
              open={openCategories.includes(key)}
              onOpenChange={() => toggleCategory(key)}
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
                      openCategories.includes(key) ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-2">
                <div className="grid gap-2 pl-4 border-l-2 border-muted ml-4">
                  {features.map((feature) => (
                    <div
                      key={feature.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.selected_features.includes(feature.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => toggleFeature(feature.id)}
                    >
                      <Checkbox
                        checked={formData.selected_features.includes(feature.id)}
                        onCheckedChange={() => toggleFeature(feature.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label className="font-medium cursor-pointer">
                          {feature.name}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
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
