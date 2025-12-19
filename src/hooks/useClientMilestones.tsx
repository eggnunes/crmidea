import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ClientMilestone {
  id: string;
  client_id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  category: string | null;
  order_index: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type MilestoneInsert = Omit<ClientMilestone, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type MilestoneUpdate = Partial<MilestoneInsert>;

export function useClientMilestones(clientId?: string) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<ClientMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = async () => {
    if (!user || !clientId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('client_milestones')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Erro ao carregar etapas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [user, clientId]);

  const addMilestone = async (milestone: MilestoneInsert) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('client_milestones')
        .insert({
          ...milestone,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setMilestones(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index));
      toast.success('Etapa adicionada!');
      return data;
    } catch (error) {
      console.error('Error adding milestone:', error);
      toast.error('Erro ao adicionar etapa');
      return null;
    }
  };

  const updateMilestone = async (id: string, updates: MilestoneUpdate) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('client_milestones')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      toast.success('Etapa atualizada!');
      return true;
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Erro ao atualizar etapa');
      return false;
    }
  };

  const toggleMilestone = async (id: string) => {
    const milestone = milestones.find(m => m.id === id);
    if (!milestone || !user || !clientId) return false;

    const isCompleted = !milestone.is_completed;
    const completedAt = isCompleted ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('client_milestones')
        .update({ is_completed: isCompleted, completed_at: completedAt })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Add timeline event if completed
      if (isCompleted) {
        await supabase.from('client_timeline').insert({
          client_id: clientId,
          user_id: user.id,
          event_type: 'milestone_concluido',
          title: `Etapa concluída: ${milestone.title}`,
          description: milestone.description || null,
          reference_id: id,
          reference_type: 'milestone',
          event_date: new Date().toISOString(),
        });
      }

      setMilestones(prev => prev.map(m => 
        m.id === id ? { ...m, is_completed: isCompleted, completed_at: completedAt } : m
      ));
      
      toast.success(isCompleted ? 'Etapa concluída!' : 'Etapa reaberta');
      return true;
    } catch (error) {
      console.error('Error toggling milestone:', error);
      toast.error('Erro ao atualizar etapa');
      return false;
    }
  };

  const deleteMilestone = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('client_milestones')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMilestones(prev => prev.filter(m => m.id !== id));
      toast.success('Etapa removida');
      return true;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Erro ao remover etapa');
      return false;
    }
  };

  // Get milestones grouped by category
  const milestonesByCategory = milestones.reduce((acc, milestone) => {
    const cat = milestone.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(milestone);
    return acc;
  }, {} as Record<string, ClientMilestone[]>);

  const completedCount = milestones.filter(m => m.is_completed).length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  return {
    milestones,
    milestonesByCategory,
    loading,
    addMilestone,
    updateMilestone,
    toggleMilestone,
    deleteMilestone,
    refetch: fetchMilestones,
    completedCount,
    totalCount: milestones.length,
    progress,
  };
}
