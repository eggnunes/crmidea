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
