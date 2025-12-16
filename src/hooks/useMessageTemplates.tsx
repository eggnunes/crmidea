import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  file_name: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export function useMessageTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setTemplates(data as MessageTemplate[]);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (template: {
    name: string;
    content?: string;
    file_url?: string;
    file_type?: string;
    file_name?: string;
    category?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("message_templates")
        .insert({
          user_id: user.id,
          name: template.name,
          content: template.content || null,
          file_url: template.file_url || null,
          file_type: template.file_type || "text",
          file_name: template.file_name || null,
          category: template.category || "geral",
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates((prev) => [...prev, data as MessageTemplate]);
      toast({ title: "Sucesso", description: "Template criado" });
      return data;
    } catch (error: any) {
      console.error("Error creating template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o template",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("message_templates")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      toast({ title: "Sucesso", description: "Template atualizado" });
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o template",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Sucesso", description: "Template excluído" });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o template",
        variant: "destructive",
      });
    }
  };

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
}
