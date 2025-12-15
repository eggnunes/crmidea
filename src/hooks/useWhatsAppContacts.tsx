import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ContactTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface WhatsAppContact {
  id: string;
  user_id: string;
  phone: string;
  name: string | null;
  notes: string | null;
  bot_disabled: boolean;
  created_at: string;
  updated_at: string;
  tags?: ContactTag[];
}

export function useWhatsAppContacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data as WhatsAppContact[]);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  }, [user]);

  const fetchTags = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("contact_tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setTags(data as ContactTag[]);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchContacts(), fetchTags()]);
      setLoading(false);
    };
    loadData();
  }, [fetchContacts, fetchTags]);

  const createContact = async (contact: { phone: string; name?: string; notes?: string }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .insert({
          user_id: user.id,
          phone: contact.phone,
          name: contact.name || null,
          notes: contact.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setContacts((prev) => [data as WhatsAppContact, ...prev]);
      toast({ title: "Sucesso", description: "Contato criado com sucesso" });
      return data;
    } catch (error: any) {
      console.error("Error creating contact:", error);
      toast({
        title: "Erro",
        description: error.message?.includes("duplicate") 
          ? "Este telefone já está cadastrado" 
          : "Não foi possível criar o contato",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateContact = async (id: string, updates: Partial<WhatsAppContact>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("whatsapp_contacts")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      toast({ title: "Sucesso", description: "Contato atualizado" });
    } catch (error) {
      console.error("Error updating contact:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o contato",
        variant: "destructive",
      });
    }
  };

  const deleteContact = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("whatsapp_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Sucesso", description: "Contato excluído" });
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contato",
        variant: "destructive",
      });
    }
  };

  const toggleBotDisabled = async (id: string, disabled: boolean) => {
    await updateContact(id, { bot_disabled: disabled });
  };

  const createTag = async (tag: { name: string; color: string }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("contact_tags")
        .insert({ user_id: user.id, name: tag.name, color: tag.color })
        .select()
        .single();

      if (error) throw error;

      setTags((prev) => [...prev, data as ContactTag]);
      toast({ title: "Sucesso", description: "Tag criada com sucesso" });
      return data;
    } catch (error) {
      console.error("Error creating tag:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a tag",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTag = async (id: string, updates: { name?: string; color?: string }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contact_tags")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setTags((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      toast({ title: "Sucesso", description: "Tag atualizada" });
    } catch (error) {
      console.error("Error updating tag:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tag",
        variant: "destructive",
      });
    }
  };

  const deleteTag = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contact_tags")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTags((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Sucesso", description: "Tag excluída" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a tag",
        variant: "destructive",
      });
    }
  };

  return {
    contacts,
    tags,
    loading,
    createContact,
    updateContact,
    deleteContact,
    toggleBotDisabled,
    createTag,
    updateTag,
    deleteTag,
    refetch: () => Promise.all([fetchContacts(), fetchTags()]),
  };
}
