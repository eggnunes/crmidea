import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProductType, LeadStatus } from '@/types/crm';

// Map frontend types to database enum types
const productMap: Record<ProductType, string> = {
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

const reverseProductMap: Record<string, ProductType> = Object.fromEntries(
  Object.entries(productMap).map(([k, v]) => [v, k as ProductType])
);

const statusMap: Record<LeadStatus, string> = {
  'novo': 'novo',
  'contato-inicial': 'em_contato',
  'negociacao': 'negociacao',
  'proposta-enviada': 'proposta_enviada',
  'fechado-ganho': 'fechado_ganho',
  'fechado-perdido': 'fechado_perdido'
};

const reverseStatusMap: Record<string, LeadStatus> = {
  'novo': 'novo',
  'em_contato': 'contato-inicial',
  'qualificado': 'contato-inicial',
  'negociacao': 'negociacao',
  'proposta_enviada': 'proposta-enviada',
  'fechado_ganho': 'fechado-ganho',
  'fechado_perdido': 'fechado-perdido'
};

export interface LeadProduct {
  id: string;
  leadId: string;
  product: ProductType;
  status: LeadStatus;
  value: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useLeadProducts(leadId?: string) {
  const [leadProducts, setLeadProducts] = useState<LeadProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeadProducts = useCallback(async () => {
    if (!leadId) {
      setLeadProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('lead_products')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts: LeadProduct[] = (data || []).map(item => ({
        id: item.id,
        leadId: item.lead_id,
        product: reverseProductMap[item.product] || item.product as ProductType,
        status: reverseStatusMap[item.status] || item.status as LeadStatus,
        value: Number(item.value) || 0,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setLeadProducts(mappedProducts);
    } catch (error: any) {
      console.error('Error fetching lead products:', error);
      toast.error('Erro ao carregar produtos do lead');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeadProducts();
  }, [fetchLeadProducts]);

  const addLeadProduct = async (data: {
    product: ProductType;
    status: LeadStatus;
    value?: number;
    notes?: string;
  }) => {
    if (!leadId) return null;

    try {
      const dbProduct = productMap[data.product] || data.product;
      const dbStatus = statusMap[data.status] || data.status;

      const { data: newProduct, error } = await supabase
        .from('lead_products')
        .insert({
          lead_id: leadId,
          product: dbProduct as any,
          status: dbStatus as any,
          value: data.value || 0,
          notes: data.notes || null
        })
        .select()
        .single();

      if (error) throw error;

      const mappedProduct: LeadProduct = {
        id: newProduct.id,
        leadId: newProduct.lead_id,
        product: reverseProductMap[newProduct.product] || newProduct.product as ProductType,
        status: reverseStatusMap[newProduct.status] || newProduct.status as LeadStatus,
        value: Number(newProduct.value) || 0,
        notes: newProduct.notes,
        createdAt: newProduct.created_at,
        updatedAt: newProduct.updated_at
      };

      setLeadProducts(prev => [mappedProduct, ...prev]);
      toast.success('Produto adicionado com sucesso');
      return mappedProduct;
    } catch (error: any) {
      console.error('Error adding lead product:', error);
      toast.error('Erro ao adicionar produto');
      return null;
    }
  };

  const updateLeadProduct = async (productId: string, data: Partial<{
    product: ProductType;
    status: LeadStatus;
    value: number;
    notes: string;
  }>) => {
    try {
      const updateData: any = {};
      
      if (data.product) {
        updateData.product = productMap[data.product] || data.product;
      }
      if (data.status) {
        updateData.status = statusMap[data.status] || data.status;
      }
      if (data.value !== undefined) {
        updateData.value = data.value;
      }
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      const { error } = await supabase
        .from('lead_products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;

      setLeadProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, ...data, updatedAt: new Date().toISOString() }
          : p
      ));

      toast.success('Produto atualizado com sucesso');
      return true;
    } catch (error: any) {
      console.error('Error updating lead product:', error);
      toast.error('Erro ao atualizar produto');
      return false;
    }
  };

  const deleteLeadProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('lead_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setLeadProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Produto removido com sucesso');
      return true;
    } catch (error: any) {
      console.error('Error deleting lead product:', error);
      toast.error('Erro ao remover produto');
      return false;
    }
  };

  return {
    leadProducts,
    loading,
    addLeadProduct,
    updateLeadProduct,
    deleteLeadProduct,
    refetch: fetchLeadProducts
  };
}
