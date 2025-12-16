import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type ChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'email' | 'telegram';

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
  channel?: ChannelType;
  channel_message_id?: string | null;
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
  channel?: ChannelType;
  channel_user_id?: string | null;
  channel_page_id?: string | null;
  profile_picture_url?: string | null;
  manychat_subscriber_id?: string | null;
}

export function useWhatsAppConversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [channelFilter, setChannelFilter] = useState<ChannelType | 'all'>('all');

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
            // Check if message already exists to prevent duplicates
            setMessages((prev) => {
              const exists = prev.some(m => m.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation, fetchConversations]);

  const sendMessage = async (conversationId: string, content: string, conversation?: WhatsAppConversation) => {
    if (!user) return;

    const conv = conversation || selectedConversation;
    const channel = conv?.channel || 'whatsapp';

    try {
      if (channel === 'whatsapp') {
        // Send via Z-API for WhatsApp
        const { error: sendError } = await supabase.functions.invoke("zapi-send-message", {
          body: {
            conversationId,
            content,
          },
        });
        if (sendError) throw sendError;
      } else if (channel === 'instagram' || channel === 'facebook') {
        let subscriberId = conv?.manychat_subscriber_id;
        
        // If no subscriber ID, try to find it via ManyChat API
        if (!subscriberId) {
          console.log('No subscriber ID found, trying to find via ManyChat API...');
          const { data: findResult } = await supabase.functions.invoke("manychat-find-subscriber", {
            body: { conversationId },
          });
          
          if (findResult?.subscriberId) {
            subscriberId = findResult.subscriberId;
            console.log('Found subscriber ID:', subscriberId);
          }
        }
        
        // If we have a subscriber ID, use ManyChat
        if (subscriberId) {
          const { data, error: sendError } = await supabase.functions.invoke("manychat-send-message", {
            body: {
              conversationId,
              content,
              subscriberId,
            },
          });
          
          if (sendError) {
            const errorBody = data || {};
            const errorMsg = errorBody.message || errorBody.error || sendError.message;
            throw new Error(errorMsg);
          }
          
          if (data?.error) {
            throw new Error(data.message || data.error);
          }
        } else {
          // Fallback to Meta API if no subscriber ID
          console.log('No subscriber ID available, trying Meta API fallback...');
          const { data, error: sendError } = await supabase.functions.invoke("meta-send-message", {
            body: {
              conversationId,
              content,
              channel,
              recipientId: conv?.channel_user_id,
            },
          });
          
          if (sendError) {
            throw new Error(sendError.message || 'Erro ao enviar via Meta API');
          }
          
          if (data?.error) {
            throw new Error(data.message || data.error || 'Para responder a este contato, peça para ele enviar uma mensagem com uma das palavras-chave configuradas no ManyChat (ex: "informações").');
          }
        }
      }

      // Refresh messages
      await fetchMessages(conversationId);
      await fetchConversations();
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível enviar a mensagem";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const filteredConversations = channelFilter === 'all' 
    ? conversations 
    : conversations.filter(c => c.channel === channelFilter);

  return {
    conversations: filteredConversations,
    allConversations: conversations,
    loading,
    selectedConversation,
    setSelectedConversation,
    messages,
    loadingMessages,
    sendMessage,
    refetch: fetchConversations,
    channelFilter,
    setChannelFilter,
  };
}
