import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  FileText, 
  Link as LinkIcon, 
  Video, 
  Trash2, 
  ExternalLink, 
  Upload, 
  Loader2,
  FolderOpen,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

interface ClientDocument {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  document_type: string;
  file_url: string | null;
  external_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

interface ClientDocumentsManagerProps {
  clientId: string;
  readOnly?: boolean;
}

export function ClientDocumentsManager({ clientId, readOnly = false }: ClientDocumentsManagerProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    document_type: "link",
    external_url: "",
    file: null as File | null
  });

  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("consulting_client_documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (file: File) => {
    if (!user) return null;
    
    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${clientId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("consulting-documents")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from("consulting-documents")
        .getPublicUrl(fileName);
      
      return { url: publicUrl, fileName: file.name, size: file.size };
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao fazer upload do arquivo");
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.title) {
      toast.error("Preencha o título");
      return;
    }

    setIsSubmitting(true);
    try {
      let fileData = null;
      
      if (formData.document_type === "file" && formData.file) {
        fileData = await handleFileUpload(formData.file);
        if (!fileData) {
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from("consulting_client_documents")
        .insert({
          client_id: clientId,
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          document_type: formData.document_type,
          external_url: formData.document_type === "link" || formData.document_type === "video" 
            ? formData.external_url 
            : null,
          file_url: fileData?.url || null,
          file_name: fileData?.fileName || null,
          file_size: fileData?.size || null
        });

      if (error) throw error;
      
      toast.success("Documento adicionado com sucesso!");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        document_type: "link",
        external_url: "",
        file: null
      });
      fetchDocuments();
    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Erro ao adicionar documento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (doc: ClientDocument) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      // Delete file from storage if exists
      if (doc.file_url && user) {
        const path = doc.file_url.split("/consulting-documents/")[1];
        if (path) {
          await supabase.storage.from("consulting-documents").remove([path]);
        }
      }

      const { error } = await supabase
        .from("consulting_client_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;
      
      toast.success("Documento excluído");
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Erro ao excluir documento");
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-5 h-5" />;
      case "file": return <FileText className="w-5 h-5" />;
      default: return <LinkIcon className="w-5 h-5" />;
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    switch (type) {
      case "video": return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Vídeo</Badge>;
      case "file": return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Arquivo</Badge>;
      default: return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Link</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Documentos e Links
            </CardTitle>
            <CardDescription>
              Materiais compartilhados e gravações de reuniões
            </CardDescription>
          </div>
          
          {!readOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Documento ou Link</DialogTitle>
                  <DialogDescription>
                    Adicione um link externo, arquivo ou vídeo de reunião.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.document_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="link">Link Externo</SelectItem>
                        <SelectItem value="video">Vídeo de Reunião</SelectItem>
                        <SelectItem value="file">Arquivo (Upload)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      placeholder="Ex: Reunião 01 - Kickoff"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descrição opcional..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  
                  {(formData.document_type === "link" || formData.document_type === "video") && (
                    <div className="space-y-2">
                      <Label>URL *</Label>
                      <Input
                        type="url"
                        placeholder={formData.document_type === "video" 
                          ? "https://drive.google.com/..." 
                          : "https://exemplo.com/documento"
                        }
                        value={formData.external_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                      />
                    </div>
                  )}
                  
                  {formData.document_type === "file" && (
                    <div className="space-y-2">
                      <Label>Arquivo *</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData(prev => ({ ...prev, file }));
                            }
                          }}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          {formData.file ? (
                            <div className="space-y-1">
                              <FileText className="w-8 h-8 mx-auto text-primary" />
                              <p className="text-sm font-medium">{formData.file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(formData.file.size)}</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Clique para selecionar um arquivo</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting || uploadingFile}>
                    {(isSubmitting || uploadingFile) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum documento compartilhado ainda.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {getDocumentIcon(doc.document_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                      {getDocumentTypeBadge(doc.document_type)}
                    </div>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      {doc.file_size && <span>• {formatFileSize(doc.file_size)}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {(doc.external_url || doc.file_url) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(doc.external_url || doc.file_url || "", "_blank")}
                      >
                        {doc.document_type === "file" ? (
                          <Download className="w-4 h-4" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
