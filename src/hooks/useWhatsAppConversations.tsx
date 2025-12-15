import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  message_type: "text" | "image" | "audio" | "document";
  content: string;
  is_from_contact: boolean;
  is_ai_response: boolean;
  zapi_message_id: string | null;
  status: "sent" | "delivered" | "read" | "failed";
  created_at: string;
}

export interface WhatsAppConversation {
  id: string;
  user_id: string;
  contact_phone: string;
  contact_name: string | null;
  last_message_at: string | null;
  unread_count: number;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
  messages?: WhatsAppMessage[];
}

export function useWhatsAppConversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setConversations(data as WhatsAppConversation[]);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data as WhatsAppMessage[]);

      // Mark as read
      await supabase
        .from("whatsapp_conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId);

    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("whatsapp-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as WhatsAppMessage;
          if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
            setMessages((prev) => [...prev, newMessage]);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation, fetchConversations]);

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) return;

    try {
      // Send via Z-API
      const { data: sendResult, error: sendError } = await supabase.functions.invoke("zapi-send-message", {
        body: {
          conversationId,
          content,
        },
      });

      if (sendError) throw sendError;

      // Refresh messages
      await fetchMessages(conversationId);
      await fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    }
  };

  return {
    conversations,
    loading,
    selectedConversation,
    setSelectedConversation,
    messages,
    loadingMessages,
    sendMessage,
    refetch: fetchConversations,
  };
}
