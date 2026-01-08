import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface LeadTag {
  id: string;
  lead_id: string;
  tag: string;
  created_at: string;
}

export function useLeadTags(leadId?: string) {
  const { user } = useAuth();
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch tags for a specific lead
  const fetchLeadTags = async (id: string) => {
    const { data, error } = await supabase
      .from("lead_tags")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching lead tags:", error);
      return [];
    }
    return data || [];
  };

  // Fetch all unique tags across all leads
  const fetchAllTags = async () => {
    const { data, error } = await supabase
      .from("lead_tags")
      .select("tag")
      .order("tag");

    if (error) {
      console.error("Error fetching all tags:", error);
      return;
    }

    // Get unique tags
    const uniqueTags = [...new Set(data?.map(t => t.tag) || [])];
    setAllTags(uniqueTags);
  };

  // Fetch leads that have a specific tag
  const fetchLeadsByTag = async (tag: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("lead_tags")
      .select("lead_id")
      .eq("tag", tag);

    if (error) {
      console.error("Error fetching leads by tag:", error);
      return [];
    }

    return data?.map(t => t.lead_id) || [];
  };

  // Add a tag to a lead
  const addTag = async (id: string, tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    
    const { error } = await supabase
      .from("lead_tags")
      .insert({
        lead_id: id,
        tag: normalizedTag,
      });

    if (error) {
      if (error.code === "23505") {
        toast.error("Esta tag já existe para este lead");
      } else {
        console.error("Error adding tag:", error);
        toast.error("Erro ao adicionar tag");
      }
      return false;
    }

    toast.success("Tag adicionada!");
    if (leadId) {
      const updatedTags = await fetchLeadTags(id);
      setTags(updatedTags);
    }
    await fetchAllTags();
    return true;
  };

  // Remove a tag from a lead
  const removeTag = async (id: string, tag: string) => {
    const { error } = await supabase
      .from("lead_tags")
      .delete()
      .eq("lead_id", id)
      .eq("tag", tag);

    if (error) {
      console.error("Error removing tag:", error);
      toast.error("Erro ao remover tag");
      return false;
    }

    toast.success("Tag removida!");
    if (leadId) {
      const updatedTags = await fetchLeadTags(id);
      setTags(updatedTags);
    }
    await fetchAllTags();
    return true;
  };

  useEffect(() => {
    if (leadId) {
      setLoading(true);
      fetchLeadTags(leadId).then(data => {
        setTags(data);
        setLoading(false);
      });
    }
    fetchAllTags();
  }, [leadId]);

  return {
    tags,
    allTags,
    loading,
    addTag,
    removeTag,
    fetchLeadsByTag,
    fetchLeadTags,
    refetch: fetchAllTags,
  };
}
