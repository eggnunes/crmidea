import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface AIIntent {
  id: string;
  user_id: string;
  intent_name: string;
  trigger_phrases: string[];
  action_type: "link" | "message" | "api_call";
  action_value: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export function useAIIntents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [intents, setIntents] = useState<AIIntent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntents = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("ai_intents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIntents(data as AIIntent[]);
    } catch (error) {
      console.error("Error fetching intents:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as intenções",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchIntents();
  }, [fetchIntents]);

  const addIntent = async (intent: Omit<AIIntent, "id" | "user_id" | "created_at">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("ai_intents")
        .insert({
          user_id: user.id,
          ...intent,
        })
        .select()
        .single();

      if (error) throw error;

      setIntents([data as AIIntent, ...intents]);
      toast({
        title: "Sucesso",
        description: "Intenção criada com sucesso",
      });
      return data;
    } catch (error) {
      console.error("Error adding intent:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a intenção",
        variant: "destructive",
      });
    }
  };

  const updateIntent = async (id: string, updates: Partial<AIIntent>) => {
    try {
      const { error } = await supabase
        .from("ai_intents")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setIntents(intents.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      toast({
        title: "Sucesso",
        description: "Intenção atualizada com sucesso",
      });
    } catch (error) {
      console.error("Error updating intent:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a intenção",
        variant: "destructive",
      });
    }
  };

  const deleteIntent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ai_intents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setIntents(intents.filter((i) => i.id !== id));
      toast({
        title: "Sucesso",
        description: "Intenção removida com sucesso",
      });
    } catch (error) {
      console.error("Error deleting intent:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a intenção",
        variant: "destructive",
      });
    }
  };

  return {
    intents,
    loading,
    addIntent,
    updateIntent,
    deleteIntent,
    refetch: fetchIntents,
  };
}
