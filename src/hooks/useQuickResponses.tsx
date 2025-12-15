import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface QuickResponse {
  id: string;
  user_id: string;
  shortcut: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useQuickResponses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<QuickResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResponses = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("quick_responses")
        .select("*")
        .eq("user_id", user.id)
        .order("shortcut");

      if (error) throw error;
      setResponses(data as QuickResponse[]);
    } catch (error) {
      console.error("Error fetching quick responses:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const createResponse = async (response: { shortcut: string; title: string; content: string }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("quick_responses")
        .insert({
          user_id: user.id,
          shortcut: response.shortcut,
          title: response.title,
          content: response.content,
        })
        .select()
        .single();

      if (error) throw error;

      setResponses((prev) => [...prev, data as QuickResponse]);
      toast({ title: "Sucesso", description: "Resposta rápida criada" });
      return data;
    } catch (error: any) {
      console.error("Error creating quick response:", error);
      toast({
        title: "Erro",
        description: error.message?.includes("duplicate")
          ? "Este atalho já existe"
          : "Não foi possível criar a resposta rápida",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateResponse = async (id: string, updates: Partial<QuickResponse>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("quick_responses")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setResponses((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
      toast({ title: "Sucesso", description: "Resposta rápida atualizada" });
    } catch (error) {
      console.error("Error updating quick response:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a resposta rápida",
        variant: "destructive",
      });
    }
  };

  const deleteResponse = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("quick_responses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setResponses((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Sucesso", description: "Resposta rápida excluída" });
    } catch (error) {
      console.error("Error deleting quick response:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a resposta rápida",
        variant: "destructive",
      });
    }
  };

  const findByShortcut = (shortcut: string) => {
    return responses.find((r) => r.shortcut.toLowerCase() === shortcut.toLowerCase());
  };

  return {
    responses,
    loading,
    createResponse,
    updateResponse,
    deleteResponse,
    findByShortcut,
    refetch: fetchResponses,
  };
}
