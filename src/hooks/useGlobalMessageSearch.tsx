import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SearchResult {
  message_id: string;
  conversation_id: string;
  content: string;
  created_at: string;
  contact_name: string | null;
  contact_phone: string;
  is_from_contact: boolean;
}

export function useGlobalMessageSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!user || !query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select(`
          id,
          conversation_id,
          content,
          created_at,
          is_from_contact,
          whatsapp_conversations!inner(contact_name, contact_phone)
        `)
        .eq("user_id", user.id)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const searchResults: SearchResult[] = (data || []).map((msg: any) => ({
        message_id: msg.id,
        conversation_id: msg.conversation_id,
        content: msg.content,
        created_at: msg.created_at,
        is_from_contact: msg.is_from_contact,
        contact_name: msg.whatsapp_conversations?.contact_name,
        contact_phone: msg.whatsapp_conversations?.contact_phone,
      }));

      setResults(searchResults);
    } catch (error) {
      console.error("Error searching messages:", error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [user]);

  const clearSearch = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    searching,
    search,
    clearSearch,
  };
}
