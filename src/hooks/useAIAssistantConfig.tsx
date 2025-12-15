import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface AIAssistantConfig {
  id: string;
  user_id: string;
  agent_name: string;
  communication_style: "formal" | "normal" | "descontraida";
  behavior_prompt: string | null;
  purpose: "suporte" | "vendas" | "uso_pessoal";
  company_name: string | null;
  company_description: string | null;
  website_url: string | null;
  use_emojis: boolean;
  sign_agent_name: boolean;
  restrict_topics: boolean;
  split_long_messages: boolean;
  allow_reminders: boolean;
  smart_training_search: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const defaultConfig: Omit<AIAssistantConfig, "id" | "user_id" | "created_at" | "updated_at"> = {
  agent_name: "IDEA - Inteligência de Dados e Artificial",
  communication_style: "descontraida",
  behavior_prompt: `O **IDEA – Inteligência de Dados e Artificial para Advogados** é um agente de IA projetado para ajudar advogados a entender e aplicar inteligência artificial na sua advocacia de forma **simples, prática e estratégica**. Ele foi desenvolvido com base na mentoria **IDEA**, criada pelo advogado e mentor **Rafael Egg Nunes**, especialista em modernização e automação de escritórios jurídicos com IA.

Aqui, você pode tirar suas dúvidas sobre como **usar IA para automatizar tarefas, otimizar a prospecção de clientes, estruturar processos internos e tornar seu escritório mais eficiente**. O IDEA responde de maneira **descontraída e objetiva**, sempre trazendo **dicas práticas, exemplos reais e sugestões de ferramentas que realmente fazem a diferença na advocacia**.`,
  purpose: "suporte",
  company_name: "IDEA - Inteligência de Dados e Artificial",
  company_description: "A IDEA – Inteligência de Dados e Artificial é um método que aplica IA para otimizar a advocacia, automatizando atendimento, criando documentos, estruturando fluxos de trabalho e potencializando a captação de clientes. Com a IDEA, advogados tornam seus escritórios mais eficientes, escaláveis e preparados para o futuro.",
  website_url: null,
  use_emojis: true,
  sign_agent_name: false,
  restrict_topics: true,
  split_long_messages: true,
  allow_reminders: true,
  smart_training_search: true,
  is_active: true,
};

export function useAIAssistantConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<AIAssistantConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("ai_assistant_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data as AIAssistantConfig);
      } else {
        // Create default config
        const { data: newConfig, error: insertError } = await supabase
          .from("ai_assistant_config")
          .insert({
            user_id: user.id,
            ...defaultConfig,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setConfig(newConfig as AIAssistantConfig);
      }
    } catch (error) {
      console.error("Error fetching AI config:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações do assistente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (updates: Partial<AIAssistantConfig>) => {
    if (!config || !user) return;

    try {
      const { error } = await supabase
        .from("ai_assistant_config")
        .update(updates)
        .eq("id", config.id);

      if (error) throw error;

      setConfig({ ...config, ...updates });
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      });
    } catch (error) {
      console.error("Error updating AI config:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    }
  };

  return {
    config,
    loading,
    updateConfig,
    refetch: fetchConfig,
  };
}
