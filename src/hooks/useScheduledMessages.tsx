import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ScheduledMessage {
  id: string;
  user_id: string;
  contact_phone: string;
  message: string;
  scheduled_at: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export function useScheduledMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("scheduled_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setMessages(data as ScheduledMessage[]);
    } catch (error) {
      console.error("Error fetching scheduled messages:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const scheduleMessage = async (data: {
    contact_phone: string;
    message: string;
    scheduled_at: Date;
  }) => {
    if (!user) return null;

    try {
      const { data: newMessage, error } = await supabase
        .from("scheduled_messages")
        .insert({
          user_id: user.id,
          contact_phone: data.contact_phone,
          message: data.message,
          scheduled_at: data.scheduled_at.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [...prev, newMessage as ScheduledMessage]);
      toast({ title: "Sucesso", description: "Mensagem agendada com sucesso" });
      return newMessage;
    } catch (error) {
      console.error("Error scheduling message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível agendar a mensagem",
        variant: "destructive",
      });
      return null;
    }
  };

  const cancelMessage = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("scheduled_messages")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "cancelled" as const } : m))
      );
      toast({ title: "Sucesso", description: "Agendamento cancelado" });
    } catch (error) {
      console.error("Error cancelling message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("scheduled_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Sucesso", description: "Agendamento excluído" });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    loading,
    scheduleMessage,
    cancelMessage,
    deleteMessage,
    refetch: fetchMessages,
  };
}
