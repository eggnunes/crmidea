import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, ArrowLeft, ArrowRight, Check, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

import { DiagnosticStep1 } from "@/components/diagnostic/DiagnosticStep1";
import { DiagnosticStep2 } from "@/components/diagnostic/DiagnosticStep2";
import { DiagnosticStep3 } from "@/components/diagnostic/DiagnosticStep3";
import { DiagnosticStep4 } from "@/components/diagnostic/DiagnosticStep4";
import { DiagnosticStep5 } from "@/components/diagnostic/DiagnosticStep5";
import { DiagnosticStep6 } from "@/components/diagnostic/DiagnosticStep6";
import { DiagnosticSuccess } from "@/components/diagnostic/DiagnosticSuccess";
import type { DiagnosticFormData } from "@/pages/PublicDiagnosticForm";

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
  feature_priorities: {},
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

export function ClientDiagnosticForm() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [consultantId, setConsultantId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DiagnosticFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const resolveConsultantId = useCallback(async () => {
    // If we already have it, nothing to do.
    if (consultantId) return consultantId;
    if (!user?.id) return null;

    // Try from client_profiles first (source of truth)
    try {
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("consultant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const fromProfile = profile?.consultant_id || null;
      if (fromProfile) {
        setConsultantId(fromProfile);
        return fromProfile;
      }
    } catch (e) {
      console.warn("[ClientDiagnosticForm] resolveConsultantId: failed reading client_profiles", e);
    }

    // Fallback: user metadata (older accounts)
    const fromMetadata = (user.user_metadata as any)?.consultant_id as string | undefined;
    if (fromMetadata) {
      setConsultantId(fromMetadata);
      return fromMetadata;
    }

    return null;
  }, [consultantId, user?.id, user?.user_metadata]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/consultoria");
        return;
      }
      
      setUser(session.user);
      const consultantIdFromMetadata = (session.user.user_metadata as any)?.consultant_id as string | undefined;
      const fullNameFromMetadata = (session.user.user_metadata as any)?.full_name as string | undefined;
      await loadProgress(session.user.id, consultantIdFromMetadata, session.user.email ?? undefined, fullNameFromMetadata);
    };

    checkAuth();
  }, [navigate]);

  const loadProgress = async (
    userId: string,
    consultantIdFromMetadata?: string,
    userEmail?: string,
    userFullName?: string
  ) => {
    try {
      // Get client profile for consultant_id
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("consultant_id, full_name, email, phone, office_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile) {
        setConsultantId(profile.consultant_id);
        
        // Pre-fill from profile
        setFormData(prev => ({
          ...prev,
          full_name: profile.full_name || prev.full_name,
          email: profile.email || prev.email,
          phone: profile.phone || prev.phone,
          office_name: profile.office_name || prev.office_name,
        }));
      } else if (consultantIdFromMetadata) {
        // Fallback for older accounts that might not have client_profiles yet
        setConsultantId(consultantIdFromMetadata);

        // Best-effort: create missing profile so next loads work normally
        const { error: profileInsertError } = await supabase
          .from("client_profiles")
          .insert({
            user_id: userId,
            consultant_id: consultantIdFromMetadata,
            full_name: userFullName || formData.full_name || "",
            email: userEmail || formData.email || "",
          });

        if (profileInsertError) {
          console.warn("[ClientDiagnosticForm] Could not create missing client_profile:", profileInsertError);
        }
      }

      // Get saved progress
      const { data: progress } = await supabase
        .from("diagnostic_form_progress")
        .select("*")
        .eq("client_user_id", userId)
        .maybeSingle();

      if (progress) {
        if (progress.is_completed) {
          setIsCompleted(true);
        } else {
          setCurrentStep(progress.current_step || 1);
          if (progress.form_data && typeof progress.form_data === 'object') {
            setFormData(prev => ({ ...prev, ...(progress.form_data as Partial<DiagnosticFormData>) }));
          }
        }
      } else {
        // Best-effort: create missing progress so autosave works
        const effectiveConsultantId = profile?.consultant_id || consultantIdFromMetadata;
        if (effectiveConsultantId) {
          const { error: progressInsertError } = await supabase
            .from("diagnostic_form_progress")
            .insert({
              client_user_id: userId,
              consultant_id: effectiveConsultantId,
              current_step: 1,
              form_data: {},
              is_completed: false,
            });
          if (progressInsertError) {
            console.warn("[ClientDiagnosticForm] Could not create missing progress:", progressInsertError);
          }
        }
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to filter out temporary UI state fields from formData
  const getCleanFormData = useCallback(() => {
    const { 
      _generatedLogoPreview, 
      _showLogoApproval, 
      _logoFeedback, 
      _showFeedbackInput,
      _caseManagementFlowchartUrl,
      _caseManagementFlowchartName,
      _clientServiceFlowchartUrl,
      _clientServiceFlowchartName,
      ...cleanData 
    } = formData;
    return cleanData;
  }, [formData]);

  const saveProgress = useCallback(async (step?: number) => {
    if (!user?.id) return;

    // IMPORTANT: do not silently skip saving when consultantId isn't loaded yet.
    // This was causing users to lose progress.
    const effectiveConsultantId = consultantId || (await resolveConsultantId());
    if (!effectiveConsultantId) {
      console.warn("[ClientDiagnosticForm] Missing consultantId - progress not saved.");
      // Avoid spamming toasts on autosave; show toast only for manual save/step transitions.
      if (step !== undefined) {
        toast.error(
          'Não foi possível vincular seu cadastro ao consultor. Saia e entre novamente pelo link de cadastro enviado pelo consultor.'
        );
      }
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Check if progress exists
      const { data: existing } = await supabase
        .from("diagnostic_form_progress")
        .select("id")
        .eq("client_user_id", user.id)
        .maybeSingle();

      const cleanData = getCleanFormData();

      if (existing) {
        const { error } = await supabase
          .from("diagnostic_form_progress")
          .update({
            current_step: step || currentStep,
            form_data: JSON.parse(JSON.stringify(cleanData)),
            is_completed: false,
          })
          .eq("client_user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("diagnostic_form_progress")
          .insert([{
            client_user_id: user.id,
            consultant_id: effectiveConsultantId,
            current_step: step || currentStep,
            form_data: JSON.parse(JSON.stringify(cleanData)),
            is_completed: false,
          }]);

        if (error) throw error;
      }
      
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving progress:", error);
      const message = (error as any)?.message || "Erro ao salvar progresso";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, consultantId, currentStep, getCleanFormData, resolveConsultantId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id && !isCompleted) {
        saveProgress();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, isCompleted, saveProgress]);

  const progress = (currentStep / STEPS.length) * 100;
  
  const updateFormData = (updates: Partial<DiagnosticFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  // Validação da etapa 1
  const validateStep1 = (): boolean => {
    const requiredFields = [
      { field: 'full_name', label: 'Nome Completo' },
      { field: 'email', label: 'E-mail' },
      { field: 'phone', label: 'Telefone/WhatsApp' },
      { field: 'office_name', label: 'Nome do Escritório' },
      { field: 'office_address', label: 'Endereço do Escritório' },
      { field: 'address_number', label: 'Número' },
      { field: 'bairro', label: 'Bairro' },
      { field: 'cidade', label: 'Cidade' },
      { field: 'estado', label: 'Estado' },
      { field: 'foundation_year', label: 'Ano de Fundação' },
      { field: 'practice_areas', label: 'Áreas de Atuação' },
    ];

    for (const { field, label } of requiredFields) {
      const value = formData[field as keyof DiagnosticFormData];
      if (!value || (typeof value === 'string' && !value.trim())) {
        toast.error(`Por favor, preencha o campo "${label}"`);
        return false;
      }
    }

    // Validar formato do telefone (mínimo 14 caracteres para (XX) XXXX-XXXX)
    if (formData.phone.length < 14) {
      toast.error('Por favor, preencha o telefone completo');
      return false;
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor, insira um e-mail válido');
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    // Validar etapa 1 antes de avançar
    if (currentStep === 1 && !validateStep1()) {
      return;
    }

    if (currentStep < STEPS.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await saveProgress(nextStep);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleManualSave = async () => {
    await saveProgress();
    toast.success("Progresso salvo!");
  };
  
  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!consultantId) {
      toast.error("Não foi possível identificar o consultor responsável. Faça logout e login novamente pelo link de cadastro do consultor.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update progress as completed
      const cleanData = getCleanFormData();
      const { error: completeError } = await supabase
        .from("diagnostic_form_progress")
        .update({
          is_completed: true,
          submitted_at: new Date().toISOString(),
          form_data: JSON.parse(JSON.stringify(cleanData)),
        })
        .eq("client_user_id", user.id);

      if (completeError) throw completeError;

      // Check if consulting_client already exists for this email
      const { data: existingClient, error: existingClientError } = await supabase
        .from("consulting_clients")
        .select("id")
        .eq("email", formData.email)
        .eq("user_id", consultantId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingClientError) {
        // With the unique constraint, this should be rare; but don't block submission.
        console.warn("[ClientDiagnosticForm] Error checking existing consulting_client:", existingClientError);
      }

      let clientId: string;

      if (existingClient) {
        // Update existing client record
        const { error } = await supabase
          .from("consulting_clients")
          .update({
            full_name: formData.full_name,
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
            feature_priorities: formData.feature_priorities,
            custom_features: formData.custom_features || null,
            motivations: formData.motivations,
            motivations_other: formData.motivations_other || null,
            expected_results: formData.expected_results,
            expected_results_other: formData.expected_results_other || null,
            tasks_to_automate: formData.tasks_to_automate || null,
            status: "in_progress",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingClient.id);

        if (error) throw error;
        clientId = existingClient.id;
        console.log("Updated existing consulting_client:", clientId);
      } else {
        // Create new consulting_client record
        const insertPayload = {
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
          feature_priorities: formData.feature_priorities,
          custom_features: formData.custom_features || null,
          motivations: formData.motivations,
          motivations_other: formData.motivations_other || null,
          expected_results: formData.expected_results,
          expected_results_other: formData.expected_results_other || null,
          tasks_to_automate: formData.tasks_to_automate || null,
          status: "in_progress",
        };

        const { data: newClient, error } = await supabase
          .from("consulting_clients")
          .insert(insertPayload)
          .select("id")
          .single();

        if (error) {
          const code = (error as any)?.code;
          if (code !== '23505') throw error;

          // If it already exists (unique constraint), fetch and update it.
          const { data: existing, error: findError } = await supabase
            .from('consulting_clients')
            .select('id')
            .eq('user_id', consultantId)
            .eq('email', formData.email)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (findError || !existing?.id) throw error;

          const { error: updateError } = await supabase
            .from('consulting_clients')
            .update(insertPayload)
            .eq('id', existing.id);

          if (updateError) throw updateError;
          clientId = existing.id;
        } else {
          clientId = newClient.id;
          console.log("Created new consulting_client:", clientId);
        }
      }

      // Award "Primeiro Passo" badge (diagnostic_complete)
      const { data: firstStepBadge } = await supabase
        .from("client_badges")
        .select("id")
        .eq("requirement_type", "diagnostic_complete")
        .maybeSingle();

      if (firstStepBadge) {
        // Check if badge already earned
        const { data: existingBadge } = await supabase
          .from("client_earned_badges")
          .select("id")
          .eq("client_id", clientId)
          .eq("badge_id", firstStepBadge.id)
          .maybeSingle();

        if (!existingBadge) {
          await supabase
            .from("client_earned_badges")
            .insert({
              client_id: clientId,
              badge_id: firstStepBadge.id,
            });
          console.log("Badge 'Primeiro Passo' awarded to client");
        }
      }

      // Add timeline event
      await supabase
        .from("client_timeline_events")
        .insert({
          client_user_id: user.id,
          consultant_id: consultantId,
          event_type: "form",
          title: "Diagnóstico concluído",
          description: "Formulário de diagnóstico preenchido e enviado com sucesso.",
        });

      // Get consultant email for notification
      const { data: consultantProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", consultantId)
        .maybeSingle();

      // Send email/WhatsApp notifications
      try {
        const aiExperienceText = formData.has_used_ai 
          ? `${formData.ai_familiarity_level || "Iniciante"} - Já usou IA`
          : "Nunca usou IA";

        await supabase.functions.invoke("send-diagnostic-notification", {
          body: {
            clientName: formData.full_name,
            clientEmail: formData.email,
            clientPhone: formData.phone,
            officeName: formData.office_name,
            consultantEmail: consultantProfile?.email || "contato@idea.com.br",
            consultantId: consultantId,
            diagnosticSummary: {
              practiceAreas: formData.practice_areas || "",
              numLawyers: formData.num_lawyers,
              numEmployees: formData.num_employees,
              selectedFeaturesCount: formData.selected_features?.length || 0,
              aiExperience: aiExperienceText,
            },
          },
        });
        console.log("Notification emails sent successfully");
      } catch (emailError) {
        console.error("Error sending notification emails:", emailError);
      }

      // Auto-generate implementation plan and Lovable prompt (in background)
      try {
        console.log("Starting auto-generation of plan and prompt...");
        supabase.functions.invoke("auto-generate-client-plan", {
          body: {
            clientEmail: formData.email,
            consultantId: consultantId,
          },
        }).then(response => {
          if (response.error) {
            console.error("Error auto-generating plan:", response.error);
          } else {
            console.log("Auto-generation completed:", response.data);
          }
        }).catch(err => {
          console.error("Error invoking auto-generate:", err);
        });
      } catch (genError) {
        console.error("Error starting auto-generation:", genError);
      }

      setIsCompleted(true);
      toast.success("Diagnóstico enviado com sucesso!");
    } catch (error) {
      console.error("Error submitting:", error);
      const message = (error as any)?.message || "Erro ao enviar. Tente novamente.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <DiagnosticStep1 formData={formData} updateFormData={updateFormData} consultantId={consultantId || undefined} />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isCompleted) {
    return (
      <DiagnosticSuccess 
        clientName={formData.full_name} 
        isLoggedIn={true}
        onBackToDashboard={() => navigate("/consultoria/dashboard")}
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Diagnóstico de Consultoria</h1>
                <p className="text-sm text-muted-foreground">IDEA - Inteligência Artificial para Advogados</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Salvo às {lastSaved.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleManualSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Salvar</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/consultoria/dashboard")}>
                Voltar ao Dashboard
              </Button>
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
