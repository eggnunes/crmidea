import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: 'email' | 'whatsapp';
  status: 'rascunho' | 'agendada' | 'em_andamento' | 'pausada' | 'concluida' | 'cancelada';
  subject: string | null;
  content: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CampaignFilter {
  id: string;
  campaign_id: string;
  filter_type: 'tag' | 'product' | 'status' | 'source' | 'all';
  filter_value: string | null;
  created_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  lead_id: string;
  status: 'pendente' | 'enviado' | 'falhou' | 'aberto' | 'clicado';
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  lead?: {
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface CampaignWithStats extends Campaign {
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  opened_count: number;
}

export function useCampaigns(campaignType?: 'email' | 'whatsapp') {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignType) {
        query = query.eq('campaign_type', campaignType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch recipient stats for each campaign
      const campaignsWithStats = await Promise.all(
        (data || []).map(async (campaign) => {
          const { data: recipients } = await supabase
            .from('campaign_recipients')
            .select('status')
            .eq('campaign_id', campaign.id);

          const stats = {
            total_recipients: recipients?.length || 0,
            sent_count: recipients?.filter(r => r.status === 'enviado').length || 0,
            failed_count: recipients?.filter(r => r.status === 'falhou').length || 0,
            opened_count: recipients?.filter(r => r.status === 'aberto').length || 0,
          };

          return { ...campaign, ...stats } as CampaignWithStats;
        })
      );

      setCampaigns(campaignsWithStats);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Erro ao carregar campanhas");
    } finally {
      setLoading(false);
    }
  }, [user, campaignType]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (
    campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'started_at' | 'completed_at'>,
    filters: Omit<CampaignFilter, 'id' | 'campaign_id' | 'created_at'>[]
  ) => {
    if (!user) return null;

    try {
      // Create the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          ...campaignData,
          user_id: user.id,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create filters
      if (filters.length > 0) {
        const { error: filtersError } = await supabase
          .from('campaign_filters')
          .insert(
            filters.map(f => ({
              campaign_id: campaign.id,
              filter_type: f.filter_type,
              filter_value: f.filter_value,
            }))
          );

        if (filtersError) throw filtersError;
      }

      toast.success("Campanha criada com sucesso");
      fetchCampaigns();
      return campaign;
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Erro ao criar campanha");
      return null;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success("Campanha atualizada");
      fetchCampaigns();
      return true;
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Erro ao atualizar campanha");
      return false;
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Campanha excluída");
      fetchCampaigns();
      return true;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Erro ao excluir campanha");
      return false;
    }
  };

  const getCampaignRecipients = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_recipients')
        .select(`
          *,
          lead:leads(name, email, phone)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CampaignRecipient[];
    } catch (error) {
      console.error("Error fetching recipients:", error);
      return [];
    }
  };

  const populateRecipients = async (campaignId: string, filters: CampaignFilter[]) => {
    if (!user) return false;

    try {
      // Build the query based on filters
      let query = supabase
        .from('leads')
        .select('id')
        .eq('user_id', user.id);

      for (const filter of filters) {
        if (filter.filter_type === 'all') continue;
        
        if (filter.filter_type === 'status' && filter.filter_value) {
          query = query.eq('status', filter.filter_value as any);
        }
        if (filter.filter_type === 'product' && filter.filter_value) {
          query = query.eq('product', filter.filter_value as any);
        }
        if (filter.filter_type === 'source' && filter.filter_value) {
          query = query.ilike('source', `%${filter.filter_value}%`);
        }
      }

      // Handle tag filter separately
      const tagFilters = filters.filter(f => f.filter_type === 'tag' && f.filter_value);
      let leadIds: string[] = [];

      if (tagFilters.length > 0) {
        const { data: taggedLeads } = await supabase
          .from('lead_tags')
          .select('lead_id')
          .in('tag', tagFilters.map(f => f.filter_value!));

        if (taggedLeads && taggedLeads.length > 0) {
          query = query.in('id', taggedLeads.map(t => t.lead_id));
        } else {
          return true; // No leads match the tag filter
        }
      }

      const { data: leads, error } = await query;

      if (error) throw error;

      if (!leads || leads.length === 0) {
        toast.info("Nenhum lead encontrado com os filtros selecionados");
        return true;
      }

      // Insert recipients
      const recipients = leads.map(lead => ({
        campaign_id: campaignId,
        lead_id: lead.id,
        status: 'pendente' as const,
      }));

      const { error: insertError } = await supabase
        .from('campaign_recipients')
        .upsert(recipients, { onConflict: 'campaign_id,lead_id' });

      if (insertError) throw insertError;

      toast.success(`${leads.length} destinatários adicionados`);
      return true;
    } catch (error) {
      console.error("Error populating recipients:", error);
      toast.error("Erro ao adicionar destinatários");
      return false;
    }
  };

  const getCampaignFilters = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_filters')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) throw error;
      return data as CampaignFilter[];
    } catch (error) {
      console.error("Error fetching filters:", error);
      return [];
    }
  };

  return {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaignRecipients,
    getCampaignFilters,
    populateRecipients,
    refetch: fetchCampaigns,
  };
}
