import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface Client {
  id: string;
  user_id: string;
  lead_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  area_atuacao: string | null;
  oab_number: string | null;
  escritorio: string | null;
  cidade: string | null;
  estado: string | null;
  product_type: string;
  contract_start_date: string;
  contract_end_date: string | null;
  contract_value: number;
  payment_status: string;
  objectives: string | null;
  challenges: string | null;
  ai_knowledge_level: string;
  form_data: Json;
  status: string;
  created_at: string;
  updated_at: string;
}

export type ClientInsert = {
  name: string;
  product_type: string;
  lead_id?: string | null;
  email?: string | null;
  phone?: string | null;
  area_atuacao?: string | null;
  oab_number?: string | null;
  escritorio?: string | null;
  cidade?: string | null;
  estado?: string | null;
  contract_start_date?: string;
  contract_end_date?: string | null;
  contract_value?: number;
  payment_status?: string;
  objectives?: string | null;
  challenges?: string | null;
  ai_knowledge_level?: string;
  form_data?: Json;
  status?: string;
};
export type ClientUpdate = Partial<ClientInsert>;

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  // Milestone templates based on product type
  const getMilestoneTemplates = (productType: string): { title: string; description: string; category: string; order_index: number }[] => {
    if (productType === 'consultoria') {
      return [
        { title: 'Onboarding', description: 'Reunião inicial de alinhamento e levantamento de necessidades', category: 'onboarding', order_index: 0 },
        { title: 'Diagnóstico', description: 'Análise da situação atual do escritório e identificação de oportunidades', category: 'onboarding', order_index: 1 },
        { title: 'Plano de Implementação', description: 'Definição do roadmap de implementação de IA', category: 'implementacao', order_index: 2 },
        { title: 'Setup de Ferramentas', description: 'Configuração das ferramentas de IA escolhidas', category: 'implementacao', order_index: 3 },
        { title: 'Treinamento Equipe', description: 'Capacitação da equipe nas ferramentas implementadas', category: 'implementacao', order_index: 4 },
        { title: 'Criação de Prompts', description: 'Desenvolvimento de prompts personalizados para o escritório', category: 'implementacao', order_index: 5 },
        { title: 'Automações', description: 'Implementação de automações nos fluxos de trabalho', category: 'implementacao', order_index: 6 },
        { title: 'Revisão 30 dias', description: 'Acompanhamento e ajustes após primeiro mês', category: 'revisao', order_index: 7 },
        { title: 'Revisão 60 dias', description: 'Avaliação de resultados e otimizações', category: 'revisao', order_index: 8 },
        { title: 'Entrega Final', description: 'Documentação e encerramento da consultoria', category: 'entrega', order_index: 9 },
      ];
    } else if (productType === 'mentoria-individual' || productType === 'mentoria_individual') {
      return [
        { title: 'Onboarding', description: 'Primeira sessão: conhecendo o mentorado e definindo objetivos', category: 'onboarding', order_index: 0 },
        { title: 'Análise de Perfil', description: 'Entender nível de conhecimento e desafios específicos', category: 'onboarding', order_index: 1 },
        { title: 'Módulo 1: Fundamentos de IA', description: 'Conceitos básicos e principais ferramentas', category: 'conteudo', order_index: 2 },
        { title: 'Módulo 2: ChatGPT Avançado', description: 'Técnicas avançadas de prompts e casos de uso', category: 'conteudo', order_index: 3 },
        { title: 'Módulo 3: Automações', description: 'Integração de IA nos fluxos de trabalho', category: 'conteudo', order_index: 4 },
        { title: 'Módulo 4: Criação de Conteúdo', description: 'IA para marketing jurídico', category: 'conteudo', order_index: 5 },
        { title: 'Projeto Prático', description: 'Implementação supervisionada no escritório', category: 'pratica', order_index: 6 },
        { title: 'Sessão de Dúvidas', description: 'Esclarecimento de dúvidas e casos específicos', category: 'revisao', order_index: 7 },
        { title: 'Encerramento', description: 'Avaliação final e próximos passos', category: 'entrega', order_index: 8 },
      ];
    } else if (productType === 'mentoria-coletiva' || productType === 'mentoria_coletiva') {
      return [
        { title: 'Boas-vindas', description: 'Acesso ao grupo e materiais iniciais', category: 'onboarding', order_index: 0 },
        { title: 'Aula 1: Introdução à IA', description: 'Fundamentos e visão geral', category: 'conteudo', order_index: 1 },
        { title: 'Aula 2: ChatGPT na Prática', description: 'Uso prático do ChatGPT', category: 'conteudo', order_index: 2 },
        { title: 'Aula 3: Prompts Jurídicos', description: 'Criação de prompts para advocacia', category: 'conteudo', order_index: 3 },
        { title: 'Aula 4: Automações', description: 'Ferramentas de automação', category: 'conteudo', order_index: 4 },
        { title: 'Encontro ao Vivo', description: 'Sessão de Q&A em grupo', category: 'pratica', order_index: 5 },
        { title: 'Encerramento', description: 'Certificado e acesso contínuo', category: 'entrega', order_index: 6 },
      ];
    }
    return [];
  };

  const addClient = async (client: ClientInsert) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...client,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add timeline event for contract creation
      await supabase.from('client_timeline').insert({
        client_id: data.id,
        user_id: user.id,
        event_type: 'contrato_assinado',
        title: 'Contrato iniciado',
        description: `Cliente ${data.name} iniciou ${data.product_type}`,
        event_date: new Date().toISOString(),
      });

      // Add default milestones based on product type
      const milestoneTemplates = getMilestoneTemplates(data.product_type);
      if (milestoneTemplates.length > 0) {
        const milestonesToInsert = milestoneTemplates.map(template => ({
          client_id: data.id,
          user_id: user.id,
          title: template.title,
          description: template.description,
          category: template.category,
          order_index: template.order_index,
          is_completed: false,
        }));

        await supabase.from('client_milestones').insert(milestonesToInsert);
      }

      setClients(prev => [data, ...prev]);
      toast.success('Cliente cadastrado com sucesso!');
      return data;
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Erro ao cadastrar cliente');
      return null;
    }
  };

  const updateClient = async (id: string, updates: ClientUpdate) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success('Cliente atualizado!');
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente');
      return false;
    }
  };

  const deleteClient = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== id));
      toast.success('Cliente removido');
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao remover cliente');
      return false;
    }
  };

  const convertLeadToClient = async (leadId: string, clientData: Partial<ClientInsert>) => {
    if (!user) return null;

    try {
      // Fetch lead data
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      // Create client from lead
      const newClient: ClientInsert = {
        lead_id: leadId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        product_type: clientData.product_type || lead.product,
        contract_start_date: clientData.contract_start_date || new Date().toISOString().split('T')[0],
        contract_end_date: clientData.contract_end_date || null,
        contract_value: clientData.contract_value || lead.value || 0,
        payment_status: clientData.payment_status || 'pendente',
        area_atuacao: clientData.area_atuacao || null,
        oab_number: clientData.oab_number || null,
        escritorio: clientData.escritorio || null,
        cidade: clientData.cidade || null,
        estado: clientData.estado || null,
        objectives: clientData.objectives || null,
        challenges: clientData.challenges || null,
        ai_knowledge_level: clientData.ai_knowledge_level || 'iniciante',
        form_data: clientData.form_data || {},
        status: 'ativo',
      };

      const client = await addClient(newClient);

      if (client) {
        // Update lead status to fechado_ganho
        await supabase
          .from('leads')
          .update({ status: 'fechado_ganho' })
          .eq('id', leadId);
      }

      return client;
    } catch (error) {
      console.error('Error converting lead to client:', error);
      toast.error('Erro ao converter lead em cliente');
      return null;
    }
  };

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    convertLeadToClient,
    refetch: fetchClients,
  };
}
