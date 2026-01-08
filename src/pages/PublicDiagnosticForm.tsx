import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, ArrowLeft, ArrowRight, Check, QrCode } from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Form step components
import { DiagnosticStep1 } from "@/components/diagnostic/DiagnosticStep1";
import { DiagnosticStep2 } from "@/components/diagnostic/DiagnosticStep2";
import { DiagnosticStep3 } from "@/components/diagnostic/DiagnosticStep3";
import { DiagnosticStep4 } from "@/components/diagnostic/DiagnosticStep4";
import { DiagnosticStep5 } from "@/components/diagnostic/DiagnosticStep5";
import { DiagnosticStep6 } from "@/components/diagnostic/DiagnosticStep6";
import { DiagnosticSuccess } from "@/components/diagnostic/DiagnosticSuccess";

export interface DiagnosticFormData {
  // Step 1 - Basic Info
  full_name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  oab_number: string;
  office_name: string;
  office_address: string;
  address_number: string;
  address_complement: string;
  bairro: string;
  cidade: string;
  estado: string;
  website: string;
  foundation_year: number | null;
  num_lawyers: number;
  num_employees: number;
  practice_areas: string;
  logo_url: string | null;
  
  // Step 2 - AI Experience
  has_used_ai: boolean | null;
  has_used_chatgpt: boolean | null;
  has_chatgpt_paid: boolean | null;
  has_chatgpt_app: boolean | null;
  ai_familiarity_level: string;
  ai_usage_frequency: string;
  ai_tools_used: string;
  ai_tasks_used: string;
  ai_difficulties: string;
  other_ai_tools: string;
  comfortable_with_tech: boolean | null;
  
  // Step 3 - Office Management
  case_management_system: string;
  case_management_other: string;
  case_management_flow: string;
  client_service_flow: string;
  
  // Step 4 - Features Selection
  selected_features: number[];
  custom_features: string;
  
  // Step 5 - Motivations & Expectations
  motivations: string[];
  motivations_other: string;
  expected_results: string[];
  expected_results_other: string;
  tasks_to_automate: string;
  
  // Step 6 - Confirmation
  confirmed: boolean;
}

const initialFormData: DiagnosticFormData = {
  full_name: "",
  email: "",
  phone: "",
  cpf_cnpj: "",
  oab_number: "",
  office_name: "",
  office_address: "",
  address_number: "",
  address_complement: "",
  bairro: "",
  cidade: "",
  estado: "",
  website: "",
  foundation_year: null,
  num_lawyers: 1,
  num_employees: 1,
  practice_areas: "",
  logo_url: null,
  has_used_ai: null,
  has_used_chatgpt: null,
  has_chatgpt_paid: null,
  has_chatgpt_app: null,
  ai_familiarity_level: "",
  ai_usage_frequency: "",
  ai_tools_used: "",
  ai_tasks_used: "",
  ai_difficulties: "",
  other_ai_tools: "",
  comfortable_with_tech: null,
  case_management_system: "",
  case_management_other: "",
  case_management_flow: "",
  client_service_flow: "",
  selected_features: [],
  custom_features: "",
  motivations: [],
  motivations_other: "",
  expected_results: [],
  expected_results_other: "",
  tasks_to_automate: "",
  confirmed: false,
};

const STEPS = [
  { id: 1, title: "Dados do Escritório", description: "Informações básicas" },
  { id: 2, title: "Experiência com IA", description: "Seu conhecimento atual" },
  { id: 3, title: "Gestão Atual", description: "Como funciona hoje" },
  { id: 4, title: "Funcionalidades", description: "O que deseja implantar" },
  { id: 5, title: "Motivações", description: "Objetivos e expectativas" },
  { id: 6, title: "Confirmação", description: "Revisão final" },
];

export function PublicDiagnosticForm() {
  const { consultantId } = useParams<{ consultantId: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DiagnosticFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  
  const progress = (currentStep / STEPS.length) * 100;
  
  const updateFormData = (updates: Partial<DiagnosticFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSubmit = async () => {
    if (!consultantId) {
      toast.error("ID do consultor não encontrado");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from("consulting_clients")
        .insert({
          user_id: consultantId,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          cpf_cnpj: formData.cpf_cnpj || null,
          oab_number: formData.oab_number || null,
          office_name: formData.office_name,
          office_address: formData.office_address,
          address_number: formData.address_number || null,
          address_complement: formData.address_complement || null,
          bairro: formData.bairro || null,
          cidade: formData.cidade || null,
          estado: formData.estado || null,
          website: formData.website || null,
          foundation_year: formData.foundation_year,
          num_lawyers: formData.num_lawyers,
          num_employees: formData.num_employees,
          practice_areas: formData.practice_areas || null,
          logo_url: formData.logo_url,
          has_used_ai: formData.has_used_ai,
          has_used_chatgpt: formData.has_used_chatgpt,
          has_chatgpt_paid: formData.has_chatgpt_paid,
          has_chatgpt_app: formData.has_chatgpt_app,
          ai_familiarity_level: formData.ai_familiarity_level || null,
          ai_usage_frequency: formData.ai_usage_frequency || null,
          ai_tools_used: formData.ai_tools_used || null,
          ai_tasks_used: formData.ai_tasks_used || null,
          ai_difficulties: formData.ai_difficulties || null,
          other_ai_tools: formData.other_ai_tools || null,
          comfortable_with_tech: formData.comfortable_with_tech,
          case_management_system: formData.case_management_system || null,
          case_management_other: formData.case_management_other || null,
          case_management_flow: formData.case_management_flow || null,
          client_service_flow: formData.client_service_flow || null,
          selected_features: formData.selected_features,
          custom_features: formData.custom_features || null,
          motivations: formData.motivations,
          motivations_other: formData.motivations_other || null,
          expected_results: formData.expected_results,
          expected_results_other: formData.expected_results_other || null,
          tasks_to_automate: formData.tasks_to_automate || null,
          status: "pending",
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setCreatedClientId(data.id);
      setIsCompleted(true);
      toast.success("Diagnóstico enviado com sucesso!");

      // Send notifications (WhatsApp and Email)
      try {
        await supabase.functions.invoke("send-consulting-notification", {
          body: {
            action: "form_submitted",
            clientId: data.id,
            consultantId: consultantId,
            clientEmail: formData.email,
            clientName: formData.full_name,
            clientPhone: formData.phone
          }
        });
      } catch (notifError) {
        console.error("Error sending notifications:", notifError);
        // Don't fail the form submission if notifications fail
      }
    } catch (error) {
      console.error("Error submitting diagnostic:", error);
      toast.error("Erro ao enviar diagnóstico. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <DiagnosticStep1 formData={formData} updateFormData={updateFormData} consultantId={consultantId} />;
      case 2:
        return <DiagnosticStep2 formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <DiagnosticStep3 formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <DiagnosticStep4 formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <DiagnosticStep5 formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <DiagnosticStep6 formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };
  
  if (isCompleted) {
    return <DiagnosticSuccess clientName={formData.full_name} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Diagnóstico de Consultoria</h1>
              <p className="text-sm text-muted-foreground">IDEA - Inteligência Artificial para Advogados</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id === currentStep
                    ? "text-primary"
                    : step.id < currentStep
                    ? "text-primary/70"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                    step.id === currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : step.id < currentStep
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-muted-foreground/30 bg-transparent"
                  }`}
                >
                  {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span className="text-xs mt-1 hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Step Content */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-primary">Etapa {currentStep}:</span> {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>
        
        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !formData.confirmed}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Enviando..." : "Enviar Diagnóstico"}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
