import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { DiagnosticFormData } from "@/pages/PublicDiagnosticForm";

interface DiagnosticStep5Props {
  formData: DiagnosticFormData;
  updateFormData: (updates: Partial<DiagnosticFormData>) => void;
}

const MOTIVATIONS = [
  { id: "efficiency", label: "Aumentar a eficiência e produtividade do escritório" },
  { id: "time", label: "Economizar tempo em tarefas repetitivas" },
  { id: "quality", label: "Melhorar a qualidade dos serviços prestados" },
  { id: "costs", label: "Reduzir custos operacionais" },
  { id: "competitive", label: "Manter competitividade no mercado" },
  { id: "innovation", label: "Inovar e modernizar o escritório" },
  { id: "client_experience", label: "Melhorar a experiência do cliente" },
  { id: "scale", label: "Escalar o escritório sem aumentar equipe" },
];

const EXPECTED_RESULTS = [
  { id: "less_manual_work", label: "Menos trabalho manual e burocrático" },
  { id: "faster_petitions", label: "Petições e documentos elaborados mais rápido" },
  { id: "better_deadline_control", label: "Melhor controle de prazos processuais" },
  { id: "faster_client_response", label: "Respostas mais rápidas aos clientes" },
  { id: "organized_processes", label: "Processos mais organizados" },
  { id: "automated_communication", label: "Comunicação automatizada com clientes" },
  { id: "financial_control", label: "Maior controle financeiro" },
  { id: "data_insights", label: "Dados e insights para tomada de decisão" },
];

export function DiagnosticStep5({ formData, updateFormData }: DiagnosticStep5Props) {
  const toggleMotivation = (id: string) => {
    const current = formData.motivations;
    const updated = current.includes(id)
      ? current.filter((m) => m !== id)
      : [...current, id];
    updateFormData({ motivations: updated });
  };
  
  const toggleExpectedResult = (id: string) => {
    const current = formData.expected_results;
    const updated = current.includes(id)
      ? current.filter((r) => r !== id)
      : [...current, id];
    updateFormData({ expected_results: updated });
  };
  
  return (
    <div className="space-y-8">
      {/* Motivations */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          O que te motivou a buscar a consultoria em IA?
        </Label>
        <p className="text-sm text-muted-foreground">
          Selecione todas as opções que se aplicam
        </p>
        
        <div className="grid gap-3">
          {MOTIVATIONS.map((motivation) => (
            <div
              key={motivation.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.motivations.includes(motivation.id)
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => toggleMotivation(motivation.id)}
            >
              <Checkbox
                checked={formData.motivations.includes(motivation.id)}
                onCheckedChange={() => toggleMotivation(motivation.id)}
              />
              <Label className="cursor-pointer font-normal flex-1">
                {motivation.label}
              </Label>
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="motivations_other">Outras motivações</Label>
          <Textarea
            id="motivations_other"
            value={formData.motivations_other}
            onChange={(e) => updateFormData({ motivations_other: e.target.value })}
            placeholder="Descreva outras motivações..."
            rows={2}
          />
        </div>
      </div>
      
      {/* Expected Results */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Quais resultados você espera alcançar com a consultoria?
        </Label>
        <p className="text-sm text-muted-foreground">
          Selecione todas as opções que se aplicam
        </p>
        
        <div className="grid gap-3">
          {EXPECTED_RESULTS.map((result) => (
            <div
              key={result.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.expected_results.includes(result.id)
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => toggleExpectedResult(result.id)}
            >
              <Checkbox
                checked={formData.expected_results.includes(result.id)}
                onCheckedChange={() => toggleExpectedResult(result.id)}
              />
              <Label className="cursor-pointer font-normal flex-1">
                {result.label}
              </Label>
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expected_results_other">Outros resultados esperados</Label>
          <Textarea
            id="expected_results_other"
            value={formData.expected_results_other}
            onChange={(e) => updateFormData({ expected_results_other: e.target.value })}
            placeholder="Descreva outros resultados que você espera..."
            rows={2}
          />
        </div>
      </div>
      
      {/* Tasks to Automate */}
      <div className="space-y-2">
        <Label htmlFor="tasks_to_automate" className="text-base font-semibold">
          Quais tarefas do seu dia a dia você gostaria de automatizar?
        </Label>
        <Textarea
          id="tasks_to_automate"
          value={formData.tasks_to_automate}
          onChange={(e) => updateFormData({ tasks_to_automate: e.target.value })}
          placeholder="Descreva as tarefas que mais consomem seu tempo e que você gostaria de automatizar ou delegar para a IA..."
          rows={4}
        />
      </div>
    </div>
  );
}
