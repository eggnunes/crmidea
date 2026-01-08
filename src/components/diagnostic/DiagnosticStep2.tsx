import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { DiagnosticFormData } from "@/pages/PublicDiagnosticForm";

interface DiagnosticStep2Props {
  formData: DiagnosticFormData;
  updateFormData: (updates: Partial<DiagnosticFormData>) => void;
}

export function DiagnosticStep2({ formData, updateFormData }: DiagnosticStep2Props) {
  return (
    <div className="space-y-6">
      {/* Has used AI */}
      <div className="space-y-3">
        <Label>Você já utilizou Inteligência Artificial no seu trabalho?</Label>
        <RadioGroup
          value={formData.has_used_ai === null ? "" : formData.has_used_ai ? "yes" : "no"}
          onValueChange={(value) => updateFormData({ has_used_ai: value === "yes" })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="ai-yes" />
            <Label htmlFor="ai-yes" className="font-normal cursor-pointer">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="ai-no" />
            <Label htmlFor="ai-no" className="font-normal cursor-pointer">Não</Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* ChatGPT specific questions */}
      <div className="space-y-3">
        <Label>Você já utilizou o ChatGPT?</Label>
        <RadioGroup
          value={formData.has_used_chatgpt === null ? "" : formData.has_used_chatgpt ? "yes" : "no"}
          onValueChange={(value) => updateFormData({ has_used_chatgpt: value === "yes" })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="chatgpt-yes" />
            <Label htmlFor="chatgpt-yes" className="font-normal cursor-pointer">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="chatgpt-no" />
            <Label htmlFor="chatgpt-no" className="font-normal cursor-pointer">Não</Label>
          </div>
        </RadioGroup>
      </div>
      
      {formData.has_used_chatgpt && (
        <>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="chatgpt-paid"
              checked={formData.has_chatgpt_paid === true}
              onCheckedChange={(checked) => updateFormData({ has_chatgpt_paid: checked === true })}
            />
            <Label htmlFor="chatgpt-paid" className="font-normal cursor-pointer">
              Possuo conta paga do ChatGPT (Plus/Pro)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="chatgpt-app"
              checked={formData.has_chatgpt_app === true}
              onCheckedChange={(checked) => updateFormData({ has_chatgpt_app: checked === true })}
            />
            <Label htmlFor="chatgpt-app" className="font-normal cursor-pointer">
              Tenho o aplicativo do ChatGPT instalado no celular
            </Label>
          </div>
        </>
      )}
      
      {/* AI Familiarity Level */}
      <div className="space-y-3">
        <Label>Qual seu nível de familiaridade com IA?</Label>
        <RadioGroup
          value={formData.ai_familiarity_level}
          onValueChange={(value) => updateFormData({ ai_familiarity_level: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="beginner" id="level-beginner" />
            <Label htmlFor="level-beginner" className="font-normal cursor-pointer">
              Iniciante - Nunca ou quase nunca usei
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="basic" id="level-basic" />
            <Label htmlFor="level-basic" className="font-normal cursor-pointer">
              Básico - Uso ocasionalmente para tarefas simples
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="intermediate" id="level-intermediate" />
            <Label htmlFor="level-intermediate" className="font-normal cursor-pointer">
              Intermediário - Uso regularmente e conheço várias ferramentas
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="advanced" id="level-advanced" />
            <Label htmlFor="level-advanced" className="font-normal cursor-pointer">
              Avançado - Uso diariamente e já integro IA em meus processos
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* AI Usage Frequency */}
      <div className="space-y-3">
        <Label>Com que frequência você utiliza ferramentas de IA?</Label>
        <RadioGroup
          value={formData.ai_usage_frequency}
          onValueChange={(value) => updateFormData({ ai_usage_frequency: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="never" id="freq-never" />
            <Label htmlFor="freq-never" className="font-normal cursor-pointer">Nunca</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rarely" id="freq-rarely" />
            <Label htmlFor="freq-rarely" className="font-normal cursor-pointer">Raramente (algumas vezes por mês)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="weekly" id="freq-weekly" />
            <Label htmlFor="freq-weekly" className="font-normal cursor-pointer">Semanalmente</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="daily" id="freq-daily" />
            <Label htmlFor="freq-daily" className="font-normal cursor-pointer">Diariamente</Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Other AI tools */}
      <div className="space-y-2">
        <Label htmlFor="other_ai_tools">Quais outras ferramentas de IA você utiliza?</Label>
        <Textarea
          id="other_ai_tools"
          value={formData.other_ai_tools}
          onChange={(e) => updateFormData({ other_ai_tools: e.target.value })}
          placeholder="Ex: Claude, Gemini, Copilot, ferramentas jurídicas com IA..."
          rows={2}
        />
      </div>
      
      {/* AI tasks used */}
      <div className="space-y-2">
        <Label htmlFor="ai_tasks_used">Para quais tarefas você utiliza IA atualmente?</Label>
        <Textarea
          id="ai_tasks_used"
          value={formData.ai_tasks_used}
          onChange={(e) => updateFormData({ ai_tasks_used: e.target.value })}
          placeholder="Ex: Redigir petições, pesquisar jurisprudência, responder e-mails..."
          rows={3}
        />
      </div>
      
      {/* AI difficulties */}
      <div className="space-y-2">
        <Label htmlFor="ai_difficulties">Quais dificuldades você enfrenta ao usar IA?</Label>
        <Textarea
          id="ai_difficulties"
          value={formData.ai_difficulties}
          onChange={(e) => updateFormData({ ai_difficulties: e.target.value })}
          placeholder="Ex: Não sei formular boas perguntas, resultados imprecisos..."
          rows={3}
        />
      </div>
      
      {/* Tech comfort */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="tech-comfort"
          checked={formData.comfortable_with_tech === true}
          onCheckedChange={(checked) => updateFormData({ comfortable_with_tech: checked === true })}
        />
        <Label htmlFor="tech-comfort" className="font-normal cursor-pointer">
          Me sinto confortável aprendendo e usando novas tecnologias
        </Label>
      </div>
    </div>
  );
}
