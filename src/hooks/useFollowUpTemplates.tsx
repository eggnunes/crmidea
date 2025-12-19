import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FollowUpTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  min_days: number;
  max_days: number;
  status_filter: string[];
  product_filter: string[];
  message_template: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FollowUpTemplateInsert = Omit<FollowUpTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type FollowUpTemplateUpdate = Partial<FollowUpTemplateInsert>;

export function useFollowUpTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<FollowUpTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follow_up_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching follow-up templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addTemplate = async (template: FollowUpTemplateInsert) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('follow_up_templates')
        .insert({
          ...template,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setTemplates(prev => [...prev, data]);
      toast.success('Template criado com sucesso!');
      return data;
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Erro ao criar template');
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: FollowUpTemplateUpdate) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('follow_up_templates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success('Template atualizado!');
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Erro ao atualizar template');
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('follow_up_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template excluído!');
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir template');
      return false;
    }
  };

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
}
