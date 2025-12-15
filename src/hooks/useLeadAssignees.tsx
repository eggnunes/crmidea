import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface LeadAssignee {
  id: string;
  lead_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
  user_name?: string;
  user_email?: string;
}

export function useLeadAssignees(leadId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignees, setAssignees] = useState<LeadAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  const fetchAssignees = useCallback(async () => {
    if (!user || !leadId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("lead_assignees")
        .select("*")
        .eq("lead_id", leadId);

      if (error) throw error;

      // Get user info for each assignee
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
  }, [user, leadId]);

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
    if (!user || !leadId) return;

    try {
      // Check if already assigned
      const existing = assignees.find((a) => a.user_id === userId);
      if (existing) {
        toast({ title: "Aviso", description: "Este usuário já está atribuído", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("lead_assignees")
        .insert({
          lead_id: leadId,
          user_id: userId,
          assigned_by: user.id,
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Responsável atribuído com sucesso" });
      fetchAssignees();
    } catch (error) {
      console.error("Error assigning user:", error);
      toast({ title: "Erro", description: "Não foi possível atribuir o responsável", variant: "destructive" });
    }
  };

  const removeAssignee = async (assigneeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("lead_assignees")
        .delete()
        .eq("id", assigneeId);

      if (error) throw error;

      setAssignees((prev) => prev.filter((a) => a.id !== assigneeId));
      toast({ title: "Sucesso", description: "Responsável removido" });
    } catch (error) {
      console.error("Error removing assignee:", error);
      toast({ title: "Erro", description: "Não foi possível remover o responsável", variant: "destructive" });
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
