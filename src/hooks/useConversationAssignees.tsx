import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ConversationAssignee {
  id: string;
  conversation_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
  user_name?: string;
  user_email?: string;
}

export function useConversationAssignees(conversationId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignees, setAssignees] = useState<ConversationAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  const fetchAssignees = useCallback(async () => {
    if (!user || !conversationId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("conversation_assignees")
        .select("*")
        .eq("conversation_id", conversationId);

      if (error) throw error;

      const userIds = data.map((a: any) => a.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds);

        const enrichedData = data.map((a: any) => {
          const profile = profiles?.find((p: any) => p.user_id === a.user_id);
          return {
            ...a,
            user_name: profile?.name || "Usuário",
            user_email: profile?.email || "",
          };
        });

        setAssignees(enrichedData);
      } else {
        setAssignees([]);
      }
    } catch (error) {
      console.error("Error fetching assignees:", error);
    } finally {
      setLoading(false);
    }
  }, [user, conversationId]);

  const fetchAvailableUsers = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, email");

      if (error) throw error;

      setAvailableUsers(
        (data || []).map((p: any) => ({
          id: p.user_id,
          name: p.name || p.email || "Usuário",
          email: p.email || "",
        }))
      );
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchAssignees();
    fetchAvailableUsers();
  }, [fetchAssignees, fetchAvailableUsers]);

  const assignUser = async (userId: string) => {
    if (!user || !conversationId) return;

    try {
      const existing = assignees.find((a) => a.user_id === userId);
      if (existing) {
        toast({ title: "Aviso", description: "Este usuário já está atribuído", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("conversation_assignees")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          assigned_by: user.id,
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Responsável atribuído" });
      fetchAssignees();
    } catch (error) {
      console.error("Error assigning user:", error);
      toast({ title: "Erro", description: "Não foi possível atribuir", variant: "destructive" });
    }
  };

  const removeAssignee = async (assigneeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("conversation_assignees")
        .delete()
        .eq("id", assigneeId);

      if (error) throw error;

      setAssignees((prev) => prev.filter((a) => a.id !== assigneeId));
      toast({ title: "Sucesso", description: "Responsável removido" });
    } catch (error) {
      console.error("Error removing assignee:", error);
      toast({ title: "Erro", description: "Não foi possível remover", variant: "destructive" });
    }
  };

  return {
    assignees,
    availableUsers,
    loading,
    assignUser,
    removeAssignee,
    refetch: fetchAssignees,
  };
}

export function useAllConversationAssignees() {
  const { user } = useAuth();
  const [assigneesMap, setAssigneesMap] = useState<Record<string, ConversationAssignee[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchAllAssignees = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: conversations } = await supabase
        .from("whatsapp_conversations")
        .select("id")
        .eq("user_id", user.id);

      if (!conversations || conversations.length === 0) {
        setLoading(false);
        return;
      }

      const convIds = conversations.map(c => c.id);
      
      const { data, error } = await supabase
        .from("conversation_assignees")
        .select("*")
        .in("conversation_id", convIds);

      if (error) throw error;

      const userIds = [...new Set(data.map((a: any) => a.user_id))];
      let profiles: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds);
        profiles = profilesData || [];
      }

      const map: Record<string, ConversationAssignee[]> = {};
      data.forEach((a: any) => {
        const profile = profiles.find((p: any) => p.user_id === a.user_id);
        const enriched = {
          ...a,
          user_name: profile?.name || "Usuário",
          user_email: profile?.email || "",
        };
        if (!map[a.conversation_id]) {
          map[a.conversation_id] = [];
        }
        map[a.conversation_id].push(enriched);
      });

      setAssigneesMap(map);
    } catch (error) {
      console.error("Error fetching all assignees:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllAssignees();
  }, [fetchAllAssignees]);

  return {
    assigneesMap,
    loading,
    refetch: fetchAllAssignees,
  };
}
