import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Copy,
  Download,
  Loader2,
  Globe,
  Brain,
  Target,
  Settings,
  FileText,
  CreditCard,
  Scale
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CONSULTING_FEATURES } from "@/data/consultingFeatures";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConsultingSessionsManager } from "./ConsultingSessionsManager";

interface ConsultingClient {
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
  foundation_year: number | null;
  website: string | null;
  num_lawyers: number;
  num_employees: number;
  practice_areas: string | null;
  status: string;
  created_at: string;
  generated_prompt: string | null;
  selected_features: number[];
  custom_features: string | null;
  has_used_ai: boolean;
  ai_familiarity_level: string;
  tasks_to_automate: string | null;
  case_management_system: string | null;
}

interface ConsultingClientDetailProps {
  client: ConsultingClient;
  onBack: () => void;
  onUpdate: () => void;
}

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluído' },
];

export function ConsultingClientDetail({ client: initialClient, onBack, onUpdate }: ConsultingClientDetailProps) {
  const { user } = useAuth();
  const [client, setClient] = useState(initialClient);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState(initialClient.generated_prompt || "");

  // Fetch full client data
  useEffect(() => {
    const fetchClient = async () => {
      const { data, error } = await supabase
        .from('consulting_clients')
        .select('*')
        .eq('id', initialClient.id)
        .single();

      if (!error && data) {
        setClient(data);
        setPrompt(data.generated_prompt || "");
      }
    };
    fetchClient();
  }, [initialClient.id]);

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consulting_clients')
        .update({ status: newStatus })
        .eq('id', client.id);

      if (error) throw error;
      setClient({ ...client, status: newStatus });
      onUpdate();
      toast.success('Status atualizado!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const generatePrompt = async () => {
    setGenerating(true);
    try {
      const selectedFeatureNames = (client.selected_features || [])
        .map(id => CONSULTING_FEATURES.find(f => f.id === id))
        .filter(Boolean)
        .map(f => `- ${f?.name}: ${f?.description}`);

      const systemPrompt = `Você é um especialista em criar prompts detalhados para o Lovable.dev criar sistemas de intranet para escritórios de advocacia. Crie um prompt completo e detalhado em português brasileiro.`;

      const userPrompt = `Crie um prompt detalhado para o Lovable.dev criar uma intranet personalizada para o seguinte escritório de advocacia:

**Informações do Escritório:**
- Nome: ${client.office_name}
- Número de advogados: ${client.num_lawyers}
- Número de colaboradores: ${client.num_employees}
- Áreas de atuação: ${client.practice_areas || 'Não informado'}
- Sistema de gestão atual: ${client.case_management_system || 'Não informado'}

**Nível de familiaridade com IA:** ${client.ai_familiarity_level || 'Iniciante'}

**Tarefas a automatizar:** ${client.tasks_to_automate || 'Não informado'}

**Funcionalidades selecionadas:**
${selectedFeatureNames.length > 0 ? selectedFeatureNames.join('\n') : 'Nenhuma funcionalidade específica selecionada'}

**Funcionalidades personalizadas:** ${client.custom_features || 'Nenhuma'}

O prompt deve:
1. Descrever a intranet de forma detalhada
2. Listar todas as funcionalidades com descrições
3. Especificar integrações necessárias
4. Incluir requisitos de design e UX
5. Mencionar segurança e permissões
6. Ser pronto para copiar e colar no Lovable.dev`;

      const response = await supabase.functions.invoke('generate-consulting-prompt', {
        body: { systemPrompt, userPrompt },
      });

      if (response.error) throw response.error;

      const generatedPrompt = response.data?.prompt || "Erro ao gerar prompt";
      
      // Save to database
      await supabase
        .from('consulting_clients')
        .update({ generated_prompt: generatedPrompt })
        .eq('id', client.id);

      setPrompt(generatedPrompt);
      setClient({ ...client, generated_prompt: generatedPrompt });
      toast.success('Prompt gerado com sucesso!');
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error('Erro ao gerar prompt');
    } finally {
      setGenerating(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    toast.success('Prompt copiado!');
  };

  const selectedFeatures = (client.selected_features || [])
    .map(id => CONSULTING_FEATURES.find(f => f.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.full_name}</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            {client.office_name}
          </p>
        </div>
        <Select value={client.status} onValueChange={updateStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Atas de Reunião
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                    {client.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="text-primary hover:underline">
                    {client.phone}
                  </a>
                </div>
                {client.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {client.website}
                    </a>
                  </div>
                )}
                {client.cpf_cnpj && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{client.cpf_cnpj}</span>
                  </div>
                )}
                {client.oab_number && (
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">OAB {client.oab_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Escritório */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Escritório
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{client.office_address}{client.address_number ? `, ${client.address_number}` : ''}</p>
                    {client.address_complement && <p className="text-muted-foreground">{client.address_complement}</p>}
                    {client.bairro && <p className="text-muted-foreground">{client.bairro}</p>}
                    {(client.cidade || client.estado) && (
                      <p className="text-muted-foreground">
                        {client.cidade}{client.cidade && client.estado ? ' - ' : ''}{client.estado}
                      </p>
                    )}
                  </div>
                </div>
                {client.foundation_year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Fundado em {client.foundation_year}</span>
                  </div>
                )}
                <div className="flex gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{client.num_lawyers}</p>
                    <p className="text-xs text-muted-foreground">Advogados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{client.num_employees}</p>
                    <p className="text-xs text-muted-foreground">Colaboradores</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conhecimento em IA */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Conhecimento em IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Já usou IA:</span>
                  <Badge variant={client.has_used_ai ? "default" : "secondary"}>
                    {client.has_used_ai ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nível:</span>
                  <Badge variant="outline">{client.ai_familiarity_level || "Iniciante"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sistema de Gestão:</span>
                  <span className="text-sm">{client.case_management_system || "Não informado"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Áreas de Atuação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Áreas e Objetivos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.practice_areas && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Áreas de Atuação:</p>
                    <p className="text-sm">{client.practice_areas}</p>
                  </div>
                )}
                {client.tasks_to_automate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tarefas a Automatizar:</p>
                    <p className="text-sm">{client.tasks_to_automate}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Funcionalidades Selecionadas
              </CardTitle>
              <CardDescription>
                {selectedFeatures.length} funcionalidade(s) selecionada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFeatures.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma funcionalidade selecionada ainda
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedFeatures.map((feature) => (
                    <div key={feature?.id} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {feature?.category}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{feature?.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {feature?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {client.custom_features && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Funcionalidades Personalizadas:</p>
                  <p className="text-sm text-muted-foreground">{client.custom_features}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Prompt para Lovable
              </CardTitle>
              <CardDescription>
                Gere um prompt personalizado para criar a intranet do cliente no Lovable.dev
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={generatePrompt} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {prompt ? "Regenerar Prompt" : "Gerar Prompt"}
                    </>
                  )}
                </Button>
                {prompt && (
                  <Button variant="outline" onClick={copyPrompt}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                )}
              </div>

              {prompt && (
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="O prompt aparecerá aqui..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <ConsultingSessionsManager clientId={client.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
