import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { Lead, Interaction, ProductType, LeadStatus } from '@/types/crm';
import type { Database } from '@/integrations/supabase/types';

type DbLead = Database['public']['Tables']['leads']['Row'];
type DbInteraction = Database['public']['Tables']['interactions']['Row'];
type DbLeadStatus = Database['public']['Enums']['lead_status'];
type DbProductType = Database['public']['Enums']['product_type'];

// Map database enum values to frontend types
const statusMap: Record<DbLeadStatus, LeadStatus> = {
  'novo': 'novo',
  'em_contato': 'contato-inicial',
  'qualificado': 'contato-inicial',
  'proposta_enviada': 'proposta-enviada',
  'negociacao': 'negociacao',
  'fechado_ganho': 'fechado-ganho',
  'fechado_perdido': 'fechado-perdido'
};

const reverseStatusMap: Record<LeadStatus, DbLeadStatus> = {
  'novo': 'novo',
  'contato-inicial': 'em_contato',
  'proposta-enviada': 'proposta_enviada',
  'negociacao': 'negociacao',
  'fechado-ganho': 'fechado_ganho',
  'fechado-perdido': 'fechado_perdido'
};

const productMap: Record<DbProductType, ProductType> = {
  'consultoria': 'consultoria',
  'mentoria_coletiva': 'mentoria-coletiva',
  'mentoria_individual': 'mentoria-individual',
  'curso_idea': 'curso-idea',
  'guia_ia': 'guia-ia',
  'codigo_prompts': 'codigo-prompts',
  'combo_ebooks': 'combo-ebooks',
  'ebook_unitario': 'ebook-unitario',
  'imersao_idea': 'imersao-idea',
  'fraternidade_safe_black': 'fraternidade-safe-black',
  'clube_mqp': 'clube-mqp',
  'fraternidade_safe_pro': 'fraternidade-safe-pro',
  'safe_skills': 'safe-skills',
  'safe_experience': 'safe-experience',
  'mentoria_marcello_safe': 'mentoria-marcello-safe'
};

const reverseProductMap: Record<ProductType, DbProductType> = {
  'consultoria': 'consultoria',
  'mentoria-coletiva': 'mentoria_coletiva',
  'mentoria-individual': 'mentoria_individual',
  'curso-idea': 'curso_idea',
  'guia-ia': 'guia_ia',
  'codigo-prompts': 'codigo_prompts',
  'combo-ebooks': 'combo_ebooks',
  'ebook-unitario': 'ebook_unitario',
  'imersao-idea': 'imersao_idea',
  'fraternidade-safe-black': 'fraternidade_safe_black',
  'clube-mqp': 'clube_mqp',
  'fraternidade-safe-pro': 'fraternidade_safe_pro',
  'safe-skills': 'safe_skills',
  'safe-experience': 'safe_experience',
  'mentoria-marcello-safe': 'mentoria_marcello_safe'
};

function mapDbLeadToLead(dbLead: DbLead, interactions: DbInteraction[] = []): Lead {
  return {
    id: dbLead.id,
    name: dbLead.name,
    email: dbLead.email,
    phone: dbLead.phone || '',
    product: productMap[dbLead.product],
    status: statusMap[dbLead.status],
    value: Number(dbLead.value) || 0,
    source: dbLead.source || '',
    notes: dbLead.notes || '',
    interactions: interactions.map(i => ({
      id: i.id,
      date: i.date.split('T')[0],
      type: (i.type as Interaction['type']) || 'outro',
      description: i.description
    })),
    createdAt: dbLead.created_at.split('T')[0],
    updatedAt: dbLead.updated_at.split('T')[0]
  };
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      if (!leadsData || leadsData.length === 0) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .in('lead_id', leadsData.map(l => l.id));

      if (interactionsError) throw interactionsError;

      const mappedLeads = leadsData.map(lead => 
        mapDbLeadToLead(
          lead, 
          (interactionsData || []).filter(i => i.lead_id === lead.id)
        )
      );

      setLeads(mappedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Erro ao carregar leads",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const syncLeadToContact = async (phone: string, name: string) => {
    if (!user || !phone) return;

    try {
      const normalizedPhone = phone.replace(/\D/g, "");
      if (!normalizedPhone) return;

      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from("whatsapp_contacts")
        .select("id")
        .eq("user_id", user.id)
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (!existingContact) {
        await supabase.from("whatsapp_contacts").insert({
          user_id: user.id,
          phone: normalizedPhone,
          name: name,
        });
      }
    } catch (error) {
      console.error("Error syncing lead to contact:", error);
    }
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone || null,
          company: null,
          product: reverseProductMap[leadData.product],
          status: reverseStatusMap[leadData.status],
          value: leadData.value,
          source: leadData.source || null,
          notes: leadData.notes || null
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-sync lead to WhatsApp contacts
      if (leadData.phone) {
        await syncLeadToContact(leadData.phone, leadData.name);
      }

      const newLead = mapDbLeadToLead(data);
      setLeads(prev => [newLead, ...prev]);

      toast({
        title: "Lead adicionado!",
        description: `${leadData.name} foi cadastrado com sucesso`,
      });

      return newLead;
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: "Erro ao adicionar lead",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!user) return;

    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.product !== undefined) updateData.product = reverseProductMap[updates.product];
      if (updates.status !== undefined) updateData.status = reverseStatusMap[updates.status];
      if (updates.value !== undefined) updateData.value = updates.value;
      if (updates.source !== undefined) updateData.source = updates.source;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.map(lead => 
        lead.id === id ? { ...lead, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : lead
      ));

      toast({
        title: "Lead atualizado!",
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Erro ao atualizar lead",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== id));

      toast({
        title: "Lead removido!",
      });
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Erro ao remover lead",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    await updateLead(id, { status });
  };

  const addInteraction = async (leadId: string, interaction: Omit<Interaction, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('interactions')
        .insert({
          lead_id: leadId,
          type: interaction.type,
          description: interaction.description,
          date: interaction.date
        })
        .select()
        .single();

      if (error) throw error;

      const newInteraction: Interaction = {
        id: data.id,
        date: data.date.split('T')[0],
        type: data.type as Interaction['type'],
        description: data.description
      };

      setLeads(prev => prev.map(lead =>
        lead.id === leadId
          ? { ...lead, interactions: [...lead.interactions, newInteraction] }
          : lead
      ));

      toast({
        title: "Interação adicionada!",
      });
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast({
        title: "Erro ao adicionar interação",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const importLeads = async (leadsToImport: (Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'> & { importedCreatedAt?: string })[]) => {
    if (!user) return;

    try {
      const insertData = leadsToImport.map(lead => ({
        user_id: user.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || null,
        company: null,
        product: reverseProductMap[lead.product] || 'consultoria' as DbProductType,
        status: reverseStatusMap[lead.status] || 'novo' as DbLeadStatus,
        value: lead.value || 0,
        source: lead.source || null,
        notes: lead.notes || null,
        created_at: lead.importedCreatedAt || new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('leads')
        .insert(insertData)
        .select();

      if (error) throw error;

      // Auto-sync imported leads with phone numbers to WhatsApp contacts
      const leadsWithPhones = leadsToImport.filter(lead => lead.phone);
      for (const lead of leadsWithPhones) {
        await syncLeadToContact(lead.phone!, lead.name);
      }

      const newLeads = (data || []).map(lead => mapDbLeadToLead(lead));
      setLeads(prev => [...newLeads, ...prev]);

      toast({
        title: "Leads importados!",
        description: `${newLeads.length} leads foram importados com sucesso`,
      });

      return newLeads;
    } catch (error) {
      console.error('Error importing leads:', error);
      toast({
        title: "Erro ao importar leads",
        description: "Verifique o formato do arquivo",
        variant: "destructive",
      });
    }
  };

  return {
    leads,
    loading,
    addLead,
    updateLead,
    deleteLead,
    updateLeadStatus,
    addInteraction,
    importLeads,
    refetch: fetchLeads
  };
}
