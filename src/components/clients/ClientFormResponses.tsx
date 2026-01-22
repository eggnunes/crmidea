import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Calendar,
  Users,
  Brain,
  CheckCircle2,
  FileText,
  Target,
  Loader2,
  Scale
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONSULTING_FEATURES, FEATURE_CATEGORIES } from "@/data/consultingFeatures";

interface ConsultingClientData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cpf_cnpj: string | null;
  oab_number: string | null;
  office_name: string;
  office_address: string;
  address_number: string | null;
  address_complement: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  website: string | null;
  foundation_year: number | null;
  num_lawyers: number;
  num_employees: number;
  practice_areas: string | null;
  has_used_ai: boolean | null;
  has_used_chatgpt: boolean | null;
  has_chatgpt_paid: boolean | null;
  has_chatgpt_app: boolean | null;
  ai_familiarity_level: string | null;
  ai_usage_frequency: string | null;
  ai_tools_used: string | null;
  ai_tasks_used: string | null;
  ai_difficulties: string | null;
  other_ai_tools: string | null;
  comfortable_with_tech: boolean | null;
  case_management_system: string | null;
  case_management_other: string | null;
  case_management_flow: string | null;
  client_service_flow: string | null;
  selected_features: number[] | null;
  feature_priorities: Record<number, 'alta' | 'media' | 'baixa'> | null;
  custom_features: string | null;
  motivations: string[] | null;
  motivations_other: string | null;
  expected_results: string[] | null;
  expected_results_other: string | null;
  tasks_to_automate: string | null;
  created_at: string;
}

type Priority = 'alta' | 'media' | 'baixa';

const PRIORITY_CONFIG: Record<Priority, { label: string; emoji: string; className: string }> = {
  alta: { label: 'Alta', emoji: '🔴', className: 'bg-red-100 text-red-800 border-red-200' },
  media: { label: 'Média', emoji: '🟡', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  baixa: { label: 'Baixa', emoji: '🟢', className: 'bg-green-100 text-green-800 border-green-200' },
};

interface ClientFormResponsesProps {
  clientId: string;
}

const MOTIVATIONS_MAP: Record<string, string> = {
  "efficiency": "Aumentar a eficiência do escritório",
  "cost_reduction": "Reduzir custos operacionais",
  "costs": "Reduzir custos operacionais",
  "quality": "Melhorar a qualidade do trabalho",
  "competitive": "Manter competitividade no mercado",
  "innovation": "Inovar e modernizar o escritório",
  "client_experience": "Melhorar a experiência do cliente",
  "team_productivity": "Aumentar a produtividade da equipe",
  "time": "Economizar tempo",
};

const EXPECTED_RESULTS_MAP: Record<string, string> = {
  "time_saving": "Economia de tempo em tarefas repetitivas",
  "error_reduction": "Redução de erros e retrabalho",
  "better_decisions": "Melhores decisões baseadas em dados",
  "client_satisfaction": "Maior satisfação dos clientes",
  "revenue_growth": "Aumento de receita",
  "process_organization": "Melhor organização dos processos",
  "team_alignment": "Maior alinhamento da equipe",
  "less_manual_work": "Menos trabalho manual",
  "faster_petitions": "Petições mais rápidas",
  "organized_processes": "Processos mais organizados",
};

export function ClientFormResponses({ clientId }: ClientFormResponsesProps) {
  const [clientData, setClientData] = useState<ConsultingClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchLatestDiagnosticFormDataByEmail = async (email: string) => {
    // The diagnostic answers are persisted in diagnostic_form_progress.form_data.
    // In some cases, consulting_clients columns are not fully synced.
    try {
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

      const clientUserId = profile?.user_id;
      if (!clientUserId) return null;

      const { data: progress } = await supabase
        .from("diagnostic_form_progress")
        .select("form_data, updated_at, is_completed")
        .eq("client_user_id", clientUserId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return progress || null;
    } catch (e) {
      console.warn("[ClientFormResponses] Failed to load diagnostic_form_progress fallback", e);
      return null;
    }
  };

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from("consulting_clients")
        .select("*")
        .eq("id", clientId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Fallback/merge from diagnostic_form_progress (source of truth for the form answers)
        const diagnostic = await fetchLatestDiagnosticFormDataByEmail(data.email);
        const formData = (diagnostic?.form_data ?? null) as Record<string, unknown> | null;

        // Merge strategy: keep consulting_clients identifiers, but enrich missing fields from form_data
        const merged: any = {
          ...formData,
          ...data,
          id: data.id,
          created_at: data.created_at,
        };

        // Normalize priorities typing
        merged.feature_priorities = (merged.feature_priorities ?? data.feature_priorities ?? null) as Record<
          number,
          Priority
        > | null;

        setClientData(merged as ConsultingClientData);
      } else {
        setClientData(null);
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureById = (id: number) => {
    return CONSULTING_FEATURES.find(f => f.id === id);
  };

  const getFeaturesByCategory = (category: string) => {
    return clientData?.selected_features?.filter(id => {
      const feature = getFeatureById(id);
      return feature?.category === category;
    }) || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Nenhum formulário encontrado. Complete o diagnóstico para ver suas respostas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-6">
        {/* Dados do Escritório */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5" />
              Dados do Escritório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nome do Escritório</p>
                <p className="font-medium">{clientData.office_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Responsável</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {clientData.full_name}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {clientData.email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {clientData.phone}
                </p>
              </div>
              {clientData.oab_number && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">OAB</p>
                  <p className="font-medium flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    {clientData.oab_number}
                  </p>
                </div>
              )}
              {clientData.website && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Website</p>
                  <p className="font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {clientData.website}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço
              </p>
              <p className="font-medium">
                {clientData.office_address}
                {clientData.address_number && `, ${clientData.address_number}`}
                {clientData.address_complement && ` - ${clientData.address_complement}`}
                {clientData.bairro && `, ${clientData.bairro}`}
                {clientData.cidade && ` - ${clientData.cidade}`}
                {clientData.estado && `/${clientData.estado}`}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{clientData.num_lawyers}</p>
                <p className="text-xs text-muted-foreground">Advogados</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{clientData.num_employees}</p>
                <p className="text-xs text-muted-foreground">Funcionários</p>
              </div>
              {clientData.foundation_year && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{clientData.foundation_year}</p>
                  <p className="text-xs text-muted-foreground">Fundação</p>
                </div>
              )}
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {clientData.selected_features?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Funcionalidades</p>
              </div>
            </div>

            {clientData.practice_areas && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Áreas de Atuação</p>
                  <p className="text-sm">{clientData.practice_areas}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Experiência com IA */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5" />
              Experiência com Inteligência Artificial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {clientData.has_used_ai && (
                <Badge variant="default" className="bg-green-500">Já usou IA</Badge>
              )}
              {clientData.has_used_chatgpt && (
                <Badge variant="default" className="bg-blue-500">Usa ChatGPT</Badge>
              )}
              {clientData.has_chatgpt_paid && (
                <Badge variant="default" className="bg-purple-500">ChatGPT Pago</Badge>
              )}
              {clientData.has_chatgpt_app && (
                <Badge variant="outline">App no celular</Badge>
              )}
              {clientData.comfortable_with_tech && (
                <Badge variant="outline" className="border-green-500 text-green-600">
                  Confortável com tecnologia
                </Badge>
              )}
            </div>

            {clientData.ai_familiarity_level && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nível de Familiaridade</p>
                <Badge variant="secondary">{clientData.ai_familiarity_level}</Badge>
              </div>
            )}

            {clientData.ai_usage_frequency && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Frequência de Uso</p>
                <p className="text-sm">{clientData.ai_usage_frequency}</p>
              </div>
            )}

            {clientData.ai_tasks_used && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tarefas que usa IA</p>
                <p className="text-sm">{clientData.ai_tasks_used}</p>
              </div>
            )}

            {clientData.ai_difficulties && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Dificuldades Encontradas</p>
                <p className="text-sm">{clientData.ai_difficulties}</p>
              </div>
            )}

            {clientData.other_ai_tools && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Outras Ferramentas de IA</p>
                <p className="text-sm">{clientData.other_ai_tools}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gestão Atual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Gestão Atual do Escritório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientData.case_management_system && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Sistema de Gestão Processual</p>
                <Badge variant="secondary">
                  {clientData.case_management_system === "other" 
                    ? clientData.case_management_other 
                    : clientData.case_management_system}
                </Badge>
              </div>
            )}

            {clientData.case_management_flow && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fluxo de Gestão de Processos</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{clientData.case_management_flow}</p>
              </div>
            )}

            {clientData.client_service_flow && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fluxo de Atendimento ao Cliente</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{clientData.client_service_flow}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funcionalidades Selecionadas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5" />
              Funcionalidades Selecionadas ({clientData.selected_features?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {FEATURE_CATEGORIES.map(category => {
                const features = getFeaturesByCategory(category.id);
                if (features.length === 0) return null;

                return (
                  <AccordionItem key={category.id} value={category.id}>
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {features.length}
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-6">
                        {features.map(id => {
                          const feature = getFeatureById(id);
                          if (!feature) return null;
                          const priority = clientData?.feature_priorities?.[id] || 'media';
                          const priorityConfig = PRIORITY_CONFIG[priority];
                          return (
                            <div key={id} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium">{feature.name}</p>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs gap-1 ${priorityConfig.className}`}
                                  >
                                    <span>{priorityConfig.emoji}</span>
                                    {priorityConfig.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{feature.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {clientData.custom_features && (
              <div className="mt-4 pt-4 border-t space-y-1">
                <p className="text-sm text-muted-foreground">Funcionalidades Personalizadas</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{clientData.custom_features}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Motivações e Expectativas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5" />
              Motivações e Expectativas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientData.motivations && clientData.motivations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Motivações</p>
                <div className="flex flex-wrap gap-2">
                  {clientData.motivations.map(m => (
                    <Badge key={m} variant="secondary">
                      {MOTIVATIONS_MAP[m] || m}
                    </Badge>
                  ))}
                </div>
                {clientData.motivations_other && (
                  <p className="text-sm text-muted-foreground italic">
                    Outras: {clientData.motivations_other}
                  </p>
                )}
              </div>
            )}

            {clientData.expected_results && clientData.expected_results.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Resultados Esperados</p>
                <div className="flex flex-wrap gap-2">
                  {clientData.expected_results.map(r => (
                    <Badge key={r} variant="outline">
                      {EXPECTED_RESULTS_MAP[r] || r}
                    </Badge>
                  ))}
                </div>
                {clientData.expected_results_other && (
                  <p className="text-sm text-muted-foreground italic">
                    Outros: {clientData.expected_results_other}
                  </p>
                )}
              </div>
            )}

            {clientData.tasks_to_automate && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tarefas que Deseja Automatizar</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{clientData.tasks_to_automate}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
