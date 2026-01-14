import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Mail, Phone, MapPin, Users, Calendar, Globe, CheckCircle2 } from "lucide-react";
import { CONSULTING_FEATURES, FEATURE_CATEGORIES } from "@/data/consultingFeatures";
import type { DiagnosticFormData } from "@/pages/PublicDiagnosticForm";

interface DiagnosticStep6Props {
  formData: DiagnosticFormData;
  updateFormData: (updates: Partial<DiagnosticFormData>) => void;
}

type Priority = 'alta' | 'media' | 'baixa';

const PRIORITY_CONFIG: Record<Priority, { label: string; emoji: string; className: string }> = {
  alta: { label: 'Alta', emoji: '🔴', className: 'bg-red-100 text-red-800 border-red-200' },
  media: { label: 'Média', emoji: '🟡', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  baixa: { label: 'Baixa', emoji: '🟢', className: 'bg-green-100 text-green-800 border-green-200' },
};

export function DiagnosticStep6({ formData, updateFormData }: DiagnosticStep6Props) {
  const selectedFeatures = CONSULTING_FEATURES.filter((f) =>
    formData.selected_features.includes(f.id)
  );
  
  const getPriority = (featureId: number): Priority => {
    return formData.feature_priorities?.[featureId] || 'media';
  };
  
  const groupedFeatures = selectedFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, typeof CONSULTING_FEATURES>);
  
  return (
    <div className="space-y-6">
      <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-2" />
        <h3 className="font-semibold text-lg">Quase lá!</h3>
        <p className="text-sm text-muted-foreground">
          Revise as informações abaixo antes de enviar o diagnóstico
        </p>
      </div>
      
      {/* Office Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={formData.logo_url || undefined} />
              <AvatarFallback className="bg-primary/10">
                <Building2 className="w-8 h-8 text-primary" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold text-lg">{formData.office_name || "Nome do Escritório"}</h4>
              <p className="text-sm font-medium">{formData.full_name}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {formData.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {formData.phone}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {formData.office_address || "Endereço não informado"}
                </span>
                {formData.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {formData.website}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {formData.num_lawyers} advogado{formData.num_lawyers !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {formData.num_employees} colaborador{formData.num_employees !== 1 ? "es" : ""}
                </Badge>
                {formData.foundation_year && (
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    Fundado em {formData.foundation_year}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Selected Features Summary */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4">
            Funcionalidades Selecionadas ({formData.selected_features.length})
          </h4>
          
          {Object.keys(groupedFeatures).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma funcionalidade selecionada
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedFeatures).map(([category, features]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>{FEATURE_CATEGORIES[category]?.icon}</span>
                    <span className="font-medium text-sm">
                      {FEATURE_CATEGORIES[category]?.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {features.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {features.map((feature) => {
                      const priority = getPriority(feature.id);
                      const config = PRIORITY_CONFIG[priority];
                      return (
                        <Badge 
                          key={feature.id} 
                          variant="outline" 
                          className={`text-xs gap-1 ${config.className}`}
                        >
                          <span>{config.emoji}</span>
                          {feature.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {formData.custom_features && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-1">Funcionalidades personalizadas:</p>
              <p className="text-sm text-muted-foreground">{formData.custom_features}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* AI Experience Summary */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3">Experiência com IA</h4>
          <div className="flex flex-wrap gap-2">
            {formData.has_used_ai && (
              <Badge variant="outline">Já usou IA</Badge>
            )}
            {formData.has_used_chatgpt && (
              <Badge variant="outline">Usa ChatGPT</Badge>
            )}
            {formData.has_chatgpt_paid && (
              <Badge variant="outline">ChatGPT Plus/Pro</Badge>
            )}
            {formData.ai_familiarity_level && (
              <Badge>
                Nível: {
                  formData.ai_familiarity_level === "beginner" ? "Iniciante" :
                  formData.ai_familiarity_level === "basic" ? "Básico" :
                  formData.ai_familiarity_level === "intermediate" ? "Intermediário" :
                  "Avançado"
                }
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation */}
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
          formData.confirmed
            ? "border-green-500 bg-green-500/5"
            : "border-muted hover:border-primary/50"
        }`}
        onClick={() => updateFormData({ confirmed: !formData.confirmed })}
      >
        <Checkbox
          checked={formData.confirmed}
          onCheckedChange={(checked) => updateFormData({ confirmed: checked === true })}
          className="mt-0.5"
        />
        <div>
          <Label className="cursor-pointer font-medium">
            Confirmo que as informações fornecidas estão corretas
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Ao confirmar, você autoriza o uso dessas informações para a elaboração 
            do plano de implementação personalizado do seu escritório.
          </p>
        </div>
      </div>
    </div>
  );
}
