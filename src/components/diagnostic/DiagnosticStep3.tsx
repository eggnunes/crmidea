import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { DiagnosticFormData } from "@/pages/PublicDiagnosticForm";

interface DiagnosticStep3Props {
  formData: DiagnosticFormData;
  updateFormData: (updates: Partial<DiagnosticFormData>) => void;
}

const CASE_MANAGEMENT_SYSTEMS = [
  { value: "projuris", label: "Projuris" },
  { value: "legal_one", label: "Legal One (Thomson Reuters)" },
  { value: "esaj", label: "e-SAJ" },
  { value: "softplan", label: "Softplan (SAJ/ESAJ)" },
  { value: "adv_manager", label: "Advogado Manager" },
  { value: "juridico_certo", label: "Jurídico Certo" },
  { value: "astrea", label: "Astrea" },
  { value: "jusfy", label: "Jusfy" },
  { value: "lawtech", label: "LawTech" },
  { value: "excel", label: "Planilhas Excel/Google Sheets" },
  { value: "none", label: "Não utilizo sistema de gestão" },
  { value: "other", label: "Outro" },
];

export function DiagnosticStep3({ formData, updateFormData }: DiagnosticStep3Props) {
  return (
    <div className="space-y-6">
      {/* Case Management System */}
      <div className="space-y-3">
        <Label>Qual sistema de gestão processual você utiliza?</Label>
        <RadioGroup
          value={formData.case_management_system}
          onValueChange={(value) => updateFormData({ case_management_system: value })}
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          {CASE_MANAGEMENT_SYSTEMS.map((system) => (
            <div key={system.value} className="flex items-center space-x-2">
              <RadioGroupItem value={system.value} id={`system-${system.value}`} />
              <Label htmlFor={`system-${system.value}`} className="font-normal cursor-pointer">
                {system.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {formData.case_management_system === "other" && (
        <div className="space-y-2">
          <Label htmlFor="case_management_other">Qual sistema você utiliza?</Label>
          <Input
            id="case_management_other"
            value={formData.case_management_other}
            onChange={(e) => updateFormData({ case_management_other: e.target.value })}
            placeholder="Nome do sistema de gestão"
          />
        </div>
      )}
      
      {/* Case Management Flow */}
      <div className="space-y-2">
        <Label htmlFor="case_management_flow">
          Como funciona o fluxo de gestão dos seus processos atualmente?
        </Label>
        <Textarea
          id="case_management_flow"
          value={formData.case_management_flow}
          onChange={(e) => updateFormData({ case_management_flow: e.target.value })}
          placeholder="Descreva como você organiza e acompanha os processos no seu escritório: 
- Como você recebe novos casos?
- Como distribui para a equipe?
- Como acompanha prazos?
- Como gerencia documentos?"
          rows={6}
        />
      </div>
      
      {/* Client Service Flow */}
      <div className="space-y-2">
        <Label htmlFor="client_service_flow">
          Como funciona o atendimento aos clientes no seu escritório?
        </Label>
        <Textarea
          id="client_service_flow"
          value={formData.client_service_flow}
          onChange={(e) => updateFormData({ client_service_flow: e.target.value })}
          placeholder="Descreva o fluxo de atendimento ao cliente:
- Como os clientes entram em contato? (WhatsApp, telefone, e-mail)
- Quem faz o primeiro atendimento?
- Como são agendadas as reuniões?
- Como vocês enviam atualizações dos processos?"
          rows={6}
        />
      </div>
    </div>
  );
}
