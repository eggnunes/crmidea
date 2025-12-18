import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { ColumnMapping } from '@/components/ColumnMapper';

interface SavedMapping {
  id: string;
  name: string;
  mapping: ColumnMapping;
  created_at: string;
  updated_at: string;
}

export function useColumnMappings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['column-mappings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('column_mappings')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return (data as unknown as SavedMapping[]) || [];
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ name, mapping }: { name: string; mapping: ColumnMapping }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Cast mapping to JSON-compatible type
      const mappingJson = JSON.parse(JSON.stringify(mapping));
      
      const { data, error } = await supabase
        .from('column_mappings')
        .insert([{
          user_id: user.id,
          name,
          mapping: mappingJson,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['column-mappings'] });
      toast({
        title: 'Mapeamento salvo',
        description: 'O mapeamento foi salvo com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o mapeamento',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('column_mappings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['column-mappings'] });
      toast({
        title: 'Mapeamento excluído',
        description: 'O mapeamento foi excluído com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o mapeamento',
        variant: 'destructive',
      });
    },
  });

  return {
    mappings,
    isLoading,
    saveMapping: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    deleteMapping: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
