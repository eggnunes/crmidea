import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  Wand2,
  RefreshCw,
  ChevronRight,
  Target,
  Layers,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CONSULTING_FEATURES, FEATURE_CATEGORIES, ConsultingFeature } from "@/data/consultingFeatures";

// Priority type
type Priority = 'alta' | 'media' | 'baixa';

// Etapa structure
interface EtapaPrompt {
  id: number;
  titulo: string;
  descricao: string;
  prompt: string;
  categoria: string;
  prioridade: Priority;
  funcionalidades: string[];
  ordem: number;
  concluida?: boolean;
}

interface ConsultingClient {
  id: string;
  full_name: string;
  email: string;
  office_name: string;
  num_lawyers: number;
  num_employees: number;
  practice_areas: string | null;
  ai_familiarity_level: string | null;
  tasks_to_automate?: string | null;
  case_management_system?: string | null;
  selected_features: number[] | null;
  custom_features?: string | null;
  generated_prompt: string | null;
  feature_priorities?: Record<string, Priority> | null;
  fragmented_prompts?: EtapaPrompt[] | null;
  logo_url?: string | null;
  website?: string | null;
}

interface FragmentedPromptsGeneratorProps {
  client: ConsultingClient;
  onUpdate: () => void;
}

type AIGenericStep = {
  titulo: string;
  descricao: string;
  prompt: string;
  categoria: string;
  prioridade: Priority;
  funcionalidades: string[];
};

const getDeterministicFallbackSteps = (client: ConsultingClient): AIGenericStep[] => {
  const office = client.office_name || "o escritório";
  return [
    {
      titulo: "GESTÃO DE DOCUMENTOS (BÁSICO)",
      descricao: "Criar um módulo simples para organizar documentos e modelos do escritório.",
      categoria: "Documentos",
      prioridade: "alta",
      funcionalidades: ["Biblioteca de documentos", "Upload e categorização", "Busca"],
      prompt: `Adicione ao projeto existente da intranet do ${office} um módulo de **Documentos** (sem recriar autenticação):

1) Crie uma nova rota/página "/documentos" e um item no menu lateral "Documentos".
2) Na página, crie duas abas: "Modelos" e "Arquivos".
3) Implemente um CRUD simples em memória (state) inicialmente para:
   - categoria (string)
   - título (string)
   - descrição (string)
   - link/arquivo (string)
4) UI:
   - tabela listando documentos
   - botão "Novo documento" abrindo modal com formulário
   - busca por texto e filtro por categoria
5) Garanta layout responsivo e consistente com o dashboard atual.

Entregue componentes reutilizáveis e deixe pronto para evoluir para persistência no backend depois.`,
    },
    {
      titulo: "ATENDIMENTO E CONTATOS (BÁSICO)",
      descricao: "Criar uma área para registrar contatos e atendimentos do escritório.",
      categoria: "Comunicação",
      prioridade: "media",
      funcionalidades: ["Agenda de contatos", "Registro de atendimentos", "Status"],
      prompt: `Adicione ao projeto existente um módulo de **Contatos & Atendimento**:

1) Crie rotas/páginas:
   - "/contatos" (lista + cadastro)
   - "/atendimentos" (lista + registro)
2) Estrutura inicial em state (sem backend) com:
   - Contato: nome, email, telefone, observações
   - Atendimento: contato vinculado, data, assunto, status (novo/em andamento/concluído), notas
3) UI:
   - cards/resumo no topo (quantos atendimentos por status)
   - tabela com filtros por status e busca
   - modal para criar/editar
4) Garanta que o menu lateral tenha links para as novas páginas e a navegação funcione.

Mantenha o design e componentes consistentes com o restante da intranet.`,
    },
    {
      titulo: "ROTINAS E CHECKLISTS (BÁSICO)",
      descricao: "Criar checklists simples para padronizar rotinas internas.",
      categoria: "Gestão",
      prioridade: "baixa",
      funcionalidades: ["Checklists", "Itens concluídos", "Templates"],
      prompt: `Adicione ao projeto existente um módulo de **Checklists** para rotinas internas:

1) Crie a rota/página "/checklists".
2) Permita criar templates de checklist (nome + lista de itens).
3) Permita instanciar um checklist a partir de um template e marcar itens como concluídos.
4) UI:
   - lista de templates à esquerda e detalhes à direita (ou abas em mobile)
   - botão "Novo template" (modal)
   - progress bar de conclusão por checklist
5) Persistência inicial pode ser em state/localStorage (se já existir padrão no projeto). Não altere autenticação.

Deixe pronto para futura persistência no backend.`,
    },
  ];
};

// Category mapping for grouping
const CATEGORY_ORDER = [
  { id: 'base', name: 'Estrutura Base', icon: '🏗️' },
  { id: 'Documentos', name: 'Documentos Jurídicos', icon: '📄' },
  { id: 'IA', name: 'Inteligência Artificial', icon: '🤖' },
  { id: 'Jurídico', name: 'Jurídico e Processual', icon: '⚖️' },
  { id: 'Comunicação', name: 'Atendimento ao Cliente', icon: '💬' },
  { id: 'Gestão', name: 'Gestão e Produtividade', icon: '📊' },
  { id: 'Financeiro', name: 'Financeiro e Comercial', icon: '💰' },
  { id: 'RH', name: 'Recursos Humanos', icon: '👥' },
  { id: 'Utilidades', name: 'Utilidades e Ferramentas', icon: '🛠️' },
  { id: 'Segurança', name: 'Segurança e Administração', icon: '🔐' },
  { id: 'Integrações', name: 'Integrações', icon: '🔗' },
];

const PRIORITY_ORDER: Priority[] = ['alta', 'media', 'baixa'];

const getPriorityLabel = (priority: Priority) => {
  switch (priority) {
    case 'alta': return '🔴 Alta';
    case 'media': return '🟡 Média';
    case 'baixa': return '🟢 Baixa';
  }
};

const getPriorityBadgeClass = (priority: Priority) => {
  switch (priority) {
    case 'alta': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'media': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'baixa': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  }
};

export function FragmentedPromptsGenerator({ client, onUpdate }: FragmentedPromptsGeneratorProps) {
  const [etapas, setEtapas] = useState<EtapaPrompt[]>((client.fragmented_prompts as EtapaPrompt[]) || []);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client.fragmented_prompts) {
      setEtapas(client.fragmented_prompts as EtapaPrompt[]);
    }
  }, [client.fragmented_prompts]);

  const getReadableError = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return "Erro desconhecido";
    }
  };

  /**
   * CRITICAL FIX: Robust diagnostic form data retrieval.
   * Uses multiple strategies to find the correct diagnostic data:
   * 1. Direct match by email in form_data
   * 2. Match via client_profiles.email -> user_id -> diagnostic_form_progress
   * 3. Match via consulting_clients.email_lc lookup
   */
  const fetchLatestDiagnosticFormDataByEmail = async (email: string) => {
    if (!email) return null;
    
    const normalizedEmail = email.trim().toLowerCase();
    console.log("[FragmentedPromptsGenerator] Fetching diagnostic data for email:", normalizedEmail);
    
    try {
      // Strategy 1: Try to find via client_profiles first
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("user_id")
        .ilike("email", normalizedEmail)
        .maybeSingle();

      let clientUserId = profile?.user_id;
      console.log("[FragmentedPromptsGenerator] Strategy 1 - client_profiles user_id:", clientUserId);

      // Strategy 2: If not found, try to find a diagnostic_form_progress with matching email in form_data
      if (!clientUserId) {
        const { data: allProgress } = await supabase
          .from("diagnostic_form_progress")
          .select("client_user_id, form_data, updated_at, is_completed")
          .eq("is_completed", true)
          .order("updated_at", { ascending: false })
          .limit(50);
        
        if (allProgress) {
          for (const p of allProgress) {
            const fd = p.form_data as any;
            if (fd?.email && fd.email.trim().toLowerCase() === normalizedEmail) {
              clientUserId = p.client_user_id;
              console.log("[FragmentedPromptsGenerator] Strategy 2 - Found via form_data email match:", clientUserId);
              break;
            }
          }
        }
      }

      if (!clientUserId) {
        console.warn("[FragmentedPromptsGenerator] Could not find client_user_id for email:", normalizedEmail);
        return null;
      }

      // Fetch the diagnostic progress with the found client_user_id
      const { data: progress } = await supabase
        .from("diagnostic_form_progress")
        .select("form_data, updated_at, is_completed")
        .eq("client_user_id", clientUserId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (progress?.form_data) {
        const fd = progress.form_data as any;
        console.log("[FragmentedPromptsGenerator] Found diagnostic data:", {
          office_name: fd.office_name,
          num_lawyers: fd.num_lawyers,
          num_employees: fd.num_employees,
          email: fd.email,
        });
      }

      return progress || null;
    } catch (e) {
      console.warn("[FragmentedPromptsGenerator] Failed to load diagnostic_form_progress fallback", e);
      return null;
    }
  };

  const trySyncClientFromDiagnostic = async () => {
    // Best-effort sync so the admin view + generators have consistent data.
    // CRITICAL: Always sync ALL fields from diagnostic to consulting_clients to ensure prompts use correct data.
    if (!client?.email) return null;

    const diagnostic = await fetchLatestDiagnosticFormDataByEmail(client.email);
    const formData = (diagnostic?.form_data ?? null) as any;
    if (!formData || typeof formData !== "object") return null;

    const selected_features = Array.isArray(formData.selected_features) ? formData.selected_features : [];
    const feature_priorities = formData.feature_priorities && typeof formData.feature_priorities === "object"
      ? formData.feature_priorities
      : null;

    try {
      // ALWAYS sync ALL fields from diagnostic_form_progress to consulting_clients.
      // The diagnostic form is the source of truth for client data.
      const patch: Record<string, unknown> = {};
      
      // Sync selected_features and feature_priorities
      if (selected_features.length > 0) patch.selected_features = selected_features;
      if (feature_priorities) patch.feature_priorities = feature_priorities;
      
      // Sync ALL other relevant fields from the diagnostic form
      if (formData.office_name && formData.office_name !== 'Não informado') {
        patch.office_name = formData.office_name;
      }
      if (typeof formData.num_lawyers === 'number' && formData.num_lawyers > 0) {
        patch.num_lawyers = formData.num_lawyers;
      }
      if (typeof formData.num_employees === 'number' && formData.num_employees > 0) {
        patch.num_employees = formData.num_employees;
      }
      if (formData.practice_areas) {
        patch.practice_areas = formData.practice_areas;
      }
      if (formData.ai_familiarity_level) {
        patch.ai_familiarity_level = formData.ai_familiarity_level;
      }
      if (formData.case_management_system) {
        patch.case_management_system = formData.case_management_system;
      }
      if (formData.tasks_to_automate) {
        patch.tasks_to_automate = formData.tasks_to_automate;
      }
      if (formData.custom_features) {
        patch.custom_features = formData.custom_features;
      }
      if (formData.website) {
        patch.website = formData.website;
      }
      if (formData.logo_url) {
        patch.logo_url = formData.logo_url;
      }
      if (typeof formData.foundation_year === 'number') {
        patch.foundation_year = formData.foundation_year;
      }

      if (Object.keys(patch).length > 0) {
        const { error } = await supabase
          .from("consulting_clients")
          .update(patch)
          .eq("id", client.id);
        if (error) {
          console.warn("[FragmentedPromptsGenerator] Failed syncing consulting_clients from diagnostic", error);
        }
      }
    } catch (e) {
      console.warn("[FragmentedPromptsGenerator] Failed syncing consulting_clients from diagnostic (exception)", e);
    }

    return { selected_features, feature_priorities, formData };
  };

  const generateFragmentedPrompts = async () => {
    setGenerating(true);
    try {
      console.log("[FragmentedPromptsGenerator] Starting generation for client:", {
        id: client.id,
        email: client.email,
        current_office: client.office_name,
        current_lawyers: client.num_lawyers,
        current_employees: client.num_employees,
      });
      
      // CRITICAL FIX: ALWAYS sync and use data from diagnostic_form_progress as the source of truth.
      // The consulting_clients table may have stale or incomplete data.
      const synced = await trySyncClientFromDiagnostic();
      const formData = synced?.formData || {};
      
      console.log("[FragmentedPromptsGenerator] Synced formData from diagnostic:", {
        office_name: formData.office_name,
        num_lawyers: formData.num_lawyers,
        num_employees: formData.num_employees,
        practice_areas: formData.practice_areas,
        has_data: Object.keys(formData).length > 0,
      });
      
      // Build an effective client object that merges diagnostic data (priority) with consulting_clients data (fallback)
      const effectiveClient: ConsultingClient = {
        ...client,
        // Override with diagnostic data if available - ALWAYS use diagnostic data when present
        office_name: formData.office_name && formData.office_name !== 'Não informado' 
          ? formData.office_name 
          : (client.office_name || "Não informado"),
        num_lawyers: typeof formData.num_lawyers === 'number' && formData.num_lawyers > 0 
          ? formData.num_lawyers 
          : (client.num_lawyers || 1),
        num_employees: typeof formData.num_employees === 'number' && formData.num_employees > 0 
          ? formData.num_employees 
          : (client.num_employees || 1),
        practice_areas: formData.practice_areas || client.practice_areas,
        ai_familiarity_level: formData.ai_familiarity_level || client.ai_familiarity_level,
        case_management_system: formData.case_management_system || client.case_management_system,
        tasks_to_automate: formData.tasks_to_automate || client.tasks_to_automate,
        custom_features: formData.custom_features || client.custom_features,
        website: formData.website || client.website,
        logo_url: formData.logo_url || client.logo_url,
      };
      
      console.log("[FragmentedPromptsGenerator] FINAL effectiveClient data for AI prompt:", {
        office_name: effectiveClient.office_name,
        num_lawyers: effectiveClient.num_lawyers,
        num_employees: effectiveClient.num_employees,
        practice_areas: effectiveClient.practice_areas,
      });
      
      // Use effective selected features and priorities from diagnostic or consulting_clients
      const effectiveSelectedFeatureIds = (Array.isArray(formData.selected_features) && formData.selected_features.length > 0)
        ? formData.selected_features
        : (client.selected_features || []);
      
      const effectiveFeaturePriorities = (formData.feature_priorities && typeof formData.feature_priorities === "object")
        ? formData.feature_priorities as Record<string, Priority>
        : (client.feature_priorities || {}) as Record<string, Priority>;

      const selectedFeatures = (effectiveSelectedFeatureIds || [])
        .map((id: number) => CONSULTING_FEATURES.find(f => f.id === id))
        .filter(Boolean) as ConsultingFeature[];

      const featurePriorities = effectiveFeaturePriorities;

      // Group features by category and priority
      const featuresByCategory: Record<string, Record<Priority, ConsultingFeature[]>> = {};
      
      selectedFeatures.forEach(feature => {
        const category = feature.category;
        const priority = featurePriorities[feature.id.toString()] || 'media';
        
        if (!featuresByCategory[category]) {
          featuresByCategory[category] = { alta: [], media: [], baixa: [] };
        }
        featuresByCategory[category][priority].push(feature);
      });

      const generatedEtapas: EtapaPrompt[] = [];
      let etapaId = 1;

      // ETAPA 1 - Estrutura Base (always first) - USE effectiveClient with correct data
      const basePrompt = await generateBasePrompt(effectiveClient);
      generatedEtapas.push({
        id: etapaId++,
        titulo: "ESTRUTURA BASE",
        descricao: "Criação da estrutura inicial da intranet com autenticação, dashboard e navegação",
        prompt: basePrompt,
        categoria: "base",
        prioridade: "alta",
        funcionalidades: ["Sistema de autenticação", "Dashboard principal", "Layout responsivo", "Navegação lateral"],
        ordem: 1,
        concluida: false
      });

      // If the client didn't select any features yet, still generate a complete multi-step roadmap.
      // This avoids producing only the base prompt (common when the diagnostic was submitted with no feature selection).
      if (selectedFeatures.length === 0) {
        let genericSteps: AIGenericStep[] = [];
        try {
          genericSteps = await generateGenericRoadmapSteps(effectiveClient);
        } catch (e) {
          // Never fail the whole generation because the generic roadmap AI call failed.
          console.warn("[FragmentedPromptsGenerator] generateGenericRoadmapSteps failed, using fallback:", e);
          genericSteps = [];
        }
        // If AI didn't return valid JSON steps, fall back to deterministic steps so we always generate multiple etapas.
        if (!genericSteps || genericSteps.length < 2) {
          genericSteps = getDeterministicFallbackSteps(effectiveClient);
        }
        for (const step of genericSteps) {
          generatedEtapas.push({
            id: etapaId++,
            titulo: step.titulo,
            descricao: step.descricao,
            prompt: step.prompt,
            categoria: step.categoria,
            prioridade: step.prioridade,
            funcionalidades: step.funcionalidades,
            ordem: etapaId - 1,
            concluida: false,
          });
        }
      }

      // Generate etapas for each priority level
      for (const priority of PRIORITY_ORDER) {
        for (const categoryInfo of CATEGORY_ORDER) {
          if (categoryInfo.id === 'base') continue;
          
          const categoryFeatures = featuresByCategory[categoryInfo.id]?.[priority] || [];
          if (categoryFeatures.length === 0) continue;

          // Split into chunks of 3-5 features - no limit on total number of etapas
          // Chunk size varies based on feature count to create manageable steps
          const chunkSize = categoryFeatures.length <= 3 ? categoryFeatures.length : Math.min(4, Math.ceil(categoryFeatures.length / Math.ceil(categoryFeatures.length / 4)));
          const chunks = chunkArray(categoryFeatures, chunkSize || 1);
          
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            // USE effectiveClient for feature prompts too
            const promptText = await generateFeaturePrompt(effectiveClient, chunk, categoryInfo.name, priority, chunks.length > 1 ? i + 1 : undefined);
            
            generatedEtapas.push({
              id: etapaId++,
              titulo: `${categoryInfo.name.toUpperCase()}${chunks.length > 1 ? ` (Parte ${i + 1})` : ''}`,
              descricao: `Implementação de ${chunk.length} funcionalidade(s) de ${categoryInfo.name} com prioridade ${getPriorityLabel(priority).replace(/🔴|🟡|🟢 /g, '')}`,
              prompt: promptText,
              categoria: categoryInfo.id,
              prioridade: priority,
              funcionalidades: chunk.map(f => f.name),
              ordem: etapaId - 1,
              concluida: false
            });
          }
        }
      }

      // Save to database - use JSON stringify/parse for JSONB compatibility
      const { error } = await supabase
        .from('consulting_clients')
        .update({ 
          fragmented_prompts: JSON.parse(JSON.stringify(generatedEtapas)),
          generated_prompt: `Projeto dividido em ${generatedEtapas.length} etapas organizadas por prioridade.`
        })
        .eq('id', client.id);

      if (error) throw error;

      setEtapas(generatedEtapas);
      toast.success(`${generatedEtapas.length} etapas geradas com sucesso!`);
      onUpdate();
    } catch (error) {
      console.error("Error generating prompts:", error);
      const message = getReadableError(error);
      toast.error(`Erro ao gerar etapas: ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  const generateGenericRoadmapSteps = async (effectiveClient: ConsultingClient): Promise<AIGenericStep[]> => {
    const systemPrompt = `Você é um especialista em criar prompts para o Lovable.dev.

Sua tarefa: gerar um ROADMAP de implementação em ETAPAS para uma intranet de escritório de advocacia, mesmo quando o cliente ainda não escolheu funcionalidades.

REGRAS:
- Gere de 2 a 4 etapas (além da Estrutura Base, que já existe).
- Cada etapa deve ter: titulo, descricao e um prompt completo pronto para colar no Lovable.
- Os prompts devem assumir que a Estrutura Base já existe (não recriar autenticação).
- Seja prático e específico (páginas, rotas, menus, componentes, estados e permissões).
- Responda APENAS com um JSON válido no formato:
{
  "steps": [
    {
      "titulo": "...",
      "descricao": "...",
      "prompt": "...",
      "categoria": "Documentos|Jurídico|Comunicação|Gestão|Segurança|Integrações|IA|Utilidades",
      "prioridade": "alta|media|baixa",
      "funcionalidades": ["...", "..."]
    }
  ]
}`;

    const userPrompt = `Contexto do cliente:
- Escritório: ${effectiveClient.office_name}
- Advogados: ${effectiveClient.num_lawyers}
- Funcionários: ${effectiveClient.num_employees}
- Áreas de atuação: ${effectiveClient.practice_areas || 'Não informado'}
- Nível de IA: ${effectiveClient.ai_familiarity_level || 'Não informado'}
- Sistema de gestão atual: ${effectiveClient.case_management_system || 'Não informado'}
- Tarefas para automatizar: ${effectiveClient.tasks_to_automate || 'Não informado'}
- Funcionalidades personalizadas (se houver): ${effectiveClient.custom_features || 'Nenhuma'}

Gere as etapas sugeridas.`;

    const { data, error } = await supabase.functions.invoke("generate-consulting-prompt", {
      body: { systemPrompt, userPrompt },
    });
    if (error) {
      console.warn("[FragmentedPromptsGenerator] generate-consulting-prompt error:", error);
      return [];
    }

    const text = data?.prompt || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    try {
      const parsed = JSON.parse(jsonMatch[0]) as { steps?: AIGenericStep[] };
      const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
      return steps
        .filter(s => s?.titulo && s?.descricao && s?.prompt)
        .slice(0, 4)
        .map(s => ({
          titulo: String(s.titulo),
          descricao: String(s.descricao),
          prompt: String(s.prompt),
          categoria: String(s.categoria || "Utilidades"),
          prioridade: (s.prioridade as Priority) || "media",
          funcionalidades: Array.isArray(s.funcionalidades) ? s.funcionalidades.map(String) : [],
        }));
    } catch {
      return [];
    }
  };

  const generateBasePrompt = async (effectiveClient: ConsultingClient): Promise<string> => {
    const systemPrompt = `Você é um especialista em criar prompts para o Lovable.dev. Crie um prompt conciso (máximo 5000 caracteres) em português brasileiro para criar a estrutura base de uma intranet.`;
    
    const userPrompt = `Crie um prompt para o Lovable.dev criar a ESTRUTURA BASE de uma intranet para:

**Escritório:** ${effectiveClient.office_name}
- ${effectiveClient.num_lawyers} advogado(s)
- ${effectiveClient.num_employees} funcionário(s)
- Áreas: ${effectiveClient.practice_areas || 'Não informado'}
${effectiveClient.website ? `- Website: ${effectiveClient.website}` : ''}
${effectiveClient.logo_url ? `- Logo: ${effectiveClient.logo_url}` : ''}

O prompt deve incluir:
1. Sistema de autenticação de usuários (login/logout)
2. Dashboard principal com navegação lateral
3. Layout responsivo e moderno
4. Tema de cores profissional para escritório de advocacia
5. Estrutura de rotas preparada para futuras funcionalidades

Tecnologias: React, TypeScript, Tailwind CSS, shadcn/ui

O prompt deve ser COMPLETO e prático, pronto para colar no Lovable.dev.`;

    // IMPORTANT: never call the AI gateway directly from the browser.
    // Always go through the backend function so secrets stay server-side and CORS/auth works.
    const { data, error } = await supabase.functions.invoke("generate-consulting-prompt", {
      body: { systemPrompt, userPrompt },
    });

    if (error) {
      // Surface backend error details for debugging.
      const message = (error as any)?.message || "Erro ao gerar prompt base";
      throw new Error(message);
    }

    return data?.prompt || "";
  };

  const generateFeaturePrompt = async (
    effectiveClient: ConsultingClient, 
    features: ConsultingFeature[], 
    categoryName: string,
    priority: Priority,
    partNumber?: number
  ): Promise<string> => {
    const systemPrompt = `Você é um especialista em criar prompts para o Lovable.dev. Crie um prompt conciso (máximo 5000 caracteres) em português brasileiro para ADICIONAR funcionalidades a um projeto existente.`;
    
    const featureList = features.map(f => `- ${f.name}: ${f.description}`).join('\n');
    
    const userPrompt = `Crie um prompt para o Lovable.dev ADICIONAR as seguintes funcionalidades de ${categoryName} ao projeto existente da intranet "${effectiveClient.office_name}":

**Funcionalidades (Prioridade ${getPriorityLabel(priority).replace(/🔴|🟡|🟢 /g, '')}):**
${featureList}

INSTRUÇÕES:
1. O projeto base JÁ EXISTE - não recriar estrutura/autenticação
2. Integrar novas funcionalidades ao dashboard existente
3. Adicionar rotas/páginas necessárias à navegação lateral
4. Manter consistência visual com o projeto
5. Ser específico sobre componentes, estados e fluxos

O prompt deve ser COMPLETO, prático e pronto para colar no Lovable.dev.`;

    const { data, error } = await supabase.functions.invoke("generate-consulting-prompt", {
      body: { systemPrompt, userPrompt },
    });

    if (error) {
      const message = (error as any)?.message || `Erro ao gerar prompt para ${categoryName}`;
      throw new Error(message);
    }

    return data?.prompt || "";
  };

  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const copyPrompt = (etapa: EtapaPrompt) => {
    navigator.clipboard.writeText(etapa.prompt);
    setCopiedId(etapa.id);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditing = (etapa: EtapaPrompt) => {
    setEditingId(etapa.id);
    setEditedPrompt(etapa.prompt);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedPrompt("");
  };

  const saveEditedPrompt = async (etapaId: number) => {
    setSaving(true);
    try {
      const updatedEtapas = etapas.map(e => 
        e.id === etapaId ? { ...e, prompt: editedPrompt } : e
      );
      
      const { error } = await supabase
        .from('consulting_clients')
        .update({ fragmented_prompts: JSON.parse(JSON.stringify(updatedEtapas)) })
        .eq('id', client.id);

      if (error) throw error;

      setEtapas(updatedEtapas);
      setEditingId(null);
      setEditedPrompt("");
      toast.success("Prompt atualizado!");
      onUpdate();
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Erro ao salvar prompt");
    } finally {
      setSaving(false);
    }
  };

  const toggleEtapaConcluida = async (etapaId: number) => {
    const updatedEtapas = etapas.map(e => 
      e.id === etapaId ? { ...e, concluida: !e.concluida } : e
    );
    
    const { error } = await supabase
      .from('consulting_clients')
      .update({ fragmented_prompts: JSON.parse(JSON.stringify(updatedEtapas)) })
      .eq('id', client.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    setEtapas(updatedEtapas);
    const etapa = updatedEtapas.find(e => e.id === etapaId);
    toast.success(etapa?.concluida ? "Etapa marcada como concluída!" : "Etapa desmarcada");
    onUpdate();
  };

  const completedCount = etapas.filter(e => e.concluida).length;
  const progressPercent = etapas.length > 0 ? (completedCount / etapas.length) * 100 : 0;

  // Group etapas by priority for display
  const etapasByPriority = {
    alta: etapas.filter(e => e.prioridade === 'alta'),
    media: etapas.filter(e => e.prioridade === 'media'),
    baixa: etapas.filter(e => e.prioridade === 'baixa')
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Prompts Fragmentados por Prioridade
              </CardTitle>
              <CardDescription>
                Gere etapas de implementação organizadas por prioridade e categoria
              </CardDescription>
            </div>
            
            <Button 
              onClick={generateFragmentedPrompts} 
              disabled={generating}
              variant={etapas.length > 0 ? "outline" : "default"}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando etapas...
                </>
              ) : etapas.length > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerar Etapas
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Gerar Etapas com IA
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Empty State */}
      {etapas.length === 0 && !generating && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-2">Nenhuma etapa gerada ainda</h3>
              <p className="text-sm mb-4 max-w-md mx-auto">
                Clique em "Gerar Etapas com IA" para criar prompts fragmentados 
                baseados nas funcionalidades e prioridades selecionadas pelo cliente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generating State */}
      {generating && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="font-semibold text-lg mb-2">Gerando etapas de implementação...</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Organizando funcionalidades por prioridade e categoria, 
                e gerando prompts otimizados para cada etapa.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapas Display */}
      {etapas.length > 0 && !generating && (
        <>
          {/* Explanation Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="w-6 h-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg">🎯 POR QUE SEU PROJETO FOI DIVIDIDO EM ETAPAS?</h3>
                    <p className="text-muted-foreground mt-1">
                      Para garantir a melhor qualidade de implementação, dividimos seu projeto em <strong>{etapas.length} etapas</strong> organizadas por prioridade e categoria.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      BENEFÍCIOS:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                      <li>• Cada etapa é processada completamente pelo Lovable</li>
                      <li>• Você acompanha o progresso gradualmente</li>
                      <li>• Funcionalidades mais importantes são implementadas primeiro</li>
                      <li>• Menor chance de erros e retrabalho</li>
                      <li>• Você pode testar cada módulo antes de avançar</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      📋 COMO FUNCIONA:
                    </h4>
                    <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal list-inside">
                      <li>Implemente as etapas na ordem apresentada</li>
                      <li>Copie e cole cada prompt no Lovable</li>
                      <li>Aguarde a geração completa antes de avançar</li>
                      <li>Marque a etapa como concluída</li>
                      <li>Passe para a próxima etapa</li>
                    </ol>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-lg">Vamos começar! 🚀</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Progresso Geral</span>
                <span className="text-sm text-muted-foreground">
                  {completedCount} de {etapas.length} etapas concluídas
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </CardContent>
          </Card>

          {/* Etapas by Priority */}
          <div className="space-y-4">
            {PRIORITY_ORDER.map(priority => {
              const priorityEtapas = etapasByPriority[priority];
              if (priorityEtapas.length === 0) return null;

              return (
                <Card key={priority}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge className={getPriorityBadgeClass(priority)}>
                        {getPriorityLabel(priority)}
                      </Badge>
                      <span>{priorityEtapas.length} etapa(s)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {priorityEtapas.map((etapa) => (
                        <AccordionItem 
                          key={etapa.id} 
                          value={`etapa-${etapa.id}`}
                          className={`rounded-lg px-4 bg-card border ${
                            etapa.concluida ? 'border-green-500/35' : 'border-border'
                          }`}
                        >
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                etapa.concluida ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
                              }`}>
                                {etapa.concluida ? <Check className="w-4 h-4" /> : etapa.ordem}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold">Etapa {etapa.ordem}: {etapa.titulo}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {CATEGORY_ORDER.find(c => c.id === etapa.categoria)?.icon || '📌'} {etapa.categoria}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className="space-y-4">
                              {/* Features list */}
                              <div>
                                <h4 className="text-sm font-medium mb-2">Funcionalidades incluídas:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {etapa.funcionalidades.map((f, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {f}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Prompt */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium">Prompt:</h4>
                                  <div className="flex gap-2">
                                    {editingId === etapa.id ? (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={cancelEditing}
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => saveEditedPrompt(etapa.id)}
                                          disabled={saving}
                                          className="gap-1"
                                        >
                                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                          Salvar
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startEditing(etapa)}
                                          className="gap-1"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          Editar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => copyPrompt(etapa)}
                                          className="gap-1"
                                        >
                                          {copiedId === etapa.id ? (
                                            <>
                                              <Check className="w-3 h-3" />
                                              Copiado!
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3 h-3" />
                                              Copiar
                                            </>
                                          )}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {editingId === etapa.id ? (
                                  <Textarea
                                    value={editedPrompt}
                                    onChange={(e) => setEditedPrompt(e.target.value)}
                                    className="min-h-[300px] font-mono text-sm"
                                  />
                                ) : (
                                  <ScrollArea className="h-[200px] rounded-lg border bg-muted/30 p-3">
                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                      {etapa.prompt}
                                    </pre>
                                  </ScrollArea>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  {etapa.prompt.length} caracteres
                                </div>
                              </div>

                              {/* Mark as completed */}
                              <div className="flex items-center justify-end pt-2 border-t">
                                <Button
                                  variant={etapa.concluida ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => toggleEtapaConcluida(etapa.id)}
                                  className="gap-2"
                                >
                                  {etapa.concluida ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      Concluída ✓
                                    </>
                                  ) : (
                                    <>
                                      <Target className="w-4 h-4" />
                                      Marcar como Concluída
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
