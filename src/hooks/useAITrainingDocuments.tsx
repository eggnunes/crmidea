import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface AITrainingDocument {
  id: string;
  user_id: string;
  title: string;
  content_type: "text" | "website" | "document";
  content: string;
  file_url: string | null;
  file_name: string | null;
  status: "pending" | "trained" | "error";
  created_at: string;
}

export function useAITrainingDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<AITrainingDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("ai_training_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data as AITrainingDocument[]);
    } catch (error) {
      console.error("Error fetching training documents:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos de treinamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const addTextDocument = async (title: string, content: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("ai_training_documents")
        .insert({
          user_id: user.id,
          title,
          content_type: "text",
          content,
          status: "trained",
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments([data as AITrainingDocument, ...documents]);
      toast({
        title: "Sucesso",
        description: "Treinamento adicionado com sucesso",
      });
      return data;
    } catch (error) {
      console.error("Error adding training document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o treinamento",
        variant: "destructive",
      });
    }
  };

  const addWebsiteDocument = async (title: string, url: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("ai_training_documents")
        .insert({
          user_id: user.id,
          title,
          content_type: "website",
          content: url,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments([data as AITrainingDocument, ...documents]);
      toast({
        title: "Sucesso",
        description: "Website adicionado para treinamento",
      });
      return data;
    } catch (error) {
      console.error("Error adding website document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o website",
        variant: "destructive",
      });
    }
  };

  const uploadDocument = async (file: File) => {
    if (!user) return;

    try {
      // Sanitize filename - remove special chars and spaces
      const sanitizedFileName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore
        .replace(/_+/g, "_"); // Collapse multiple underscores
      
      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${sanitizedFileName}`;
      const { error: uploadError } = await supabase.storage
        .from("training-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("training-documents")
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from("ai_training_documents")
        .insert({
          user_id: user.id,
          title: file.name.replace(/\.[^/.]+$/, ""),
          content_type: "document",
          content: `Documento: ${file.name}`,
          file_url: urlData.publicUrl,
          file_name: file.name,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments([data as AITrainingDocument, ...documents]);
      toast({
        title: "Sucesso",
        description: "Documento enviado para processamento",
      });
      
      // Trigger processing
      await supabase.functions.invoke("process-training-document", {
        body: { documentId: data.id },
      });

      return data;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o documento",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const doc = documents.find((d) => d.id === id);
      
      // Delete file from storage if exists
      if (doc?.file_url) {
        const filePath = doc.file_url.split("/").slice(-2).join("/");
        await supabase.storage.from("training-documents").remove([filePath]);
      }

      const { error } = await supabase
        .from("ai_training_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDocuments(documents.filter((d) => d.id !== id));
      toast({
        title: "Sucesso",
        description: "Treinamento removido com sucesso",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o treinamento",
        variant: "destructive",
      });
    }
  };

  return {
    documents,
    loading,
    addTextDocument,
    addWebsiteDocument,
    uploadDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
}
