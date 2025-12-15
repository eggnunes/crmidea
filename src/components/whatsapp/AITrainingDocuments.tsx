import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  BookOpen,
  FileText,
  Globe,
  Upload,
  Trash2,
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAITrainingDocuments, AITrainingDocument } from "@/hooks/useAITrainingDocuments";

const statusConfig = {
  pending: { label: "Processando", icon: Clock, color: "bg-yellow-500" },
  trained: { label: "Treinado", icon: CheckCircle, color: "bg-green-500" },
  error: { label: "Erro", icon: AlertCircle, color: "bg-red-500" },
};

export function AITrainingDocuments() {
  const { documents, loading, addTextDocument, addWebsiteDocument, uploadDocument, deleteDocument } =
    useAITrainingDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [saving, setSaving] = useState(false);

  // Text form
  const [textContent, setTextContent] = useState("");

  // Website form
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddText = async () => {
    if (!textContent.trim()) return;
    setSaving(true);
    await addTextDocument(textContent.slice(0, 50) + "...", textContent);
    setTextContent("");
    setSaving(false);
  };

  const handleAddWebsite = async () => {
    if (!websiteUrl.trim()) return;
    setSaving(true);
    await addWebsiteDocument(websiteTitle || websiteUrl, websiteUrl);
    setWebsiteUrl("");
    setWebsiteTitle("");
    setSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSaving(true);
    await uploadDocument(file);
    setSaving(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Training Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Treinamentos
          </CardTitle>
          <CardDescription>
            Adicione textos, websites ou documentos para treinar seu assistente de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Texto
              </TabsTrigger>
              <TabsTrigger value="website" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Documento
              </TabsTrigger>
              <TabsTrigger value="video" disabled className="flex items-center gap-2 opacity-50">
                Vídeo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Novo treinamento via texto
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {textContent.length}/1028
                  </span>
                </div>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Escreva uma afirmação e tecle enter para cadastrar..."
                  className="min-h-[100px]"
                  maxLength={1028}
                />
              </div>
              <Button onClick={handleAddText} disabled={saving || !textContent.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Cadastrar
              </Button>
            </TabsContent>

            <TabsContent value="website" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={websiteTitle}
                  onChange={(e) => setWebsiteTitle(e.target.value)}
                  placeholder="Título do website (opcional)"
                />
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                  type="url"
                />
              </div>
              <Button onClick={handleAddWebsite} disabled={saving || !websiteUrl.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Adicionar Website
              </Button>
            </TabsContent>

            <TabsContent value="document" className="space-y-4 mt-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Envie seus documentos</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Suporta PDF, DOC, DOCX, TXT até 100MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Selecionar Arquivo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Os documentos serão processados e o conteúdo será extraído automaticamente para treinar a IA
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Treinamentos cadastrados</CardTitle>
            <span className="text-sm text-muted-foreground">
              Itens: {filteredDocuments.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar treinamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mb-2 opacity-50" />
                <p>Nenhum treinamento encontrado</p>
                <p className="text-sm">Adicione textos, websites ou documentos acima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <DocumentItem key={doc.id} document={doc} onDelete={deleteDocument} />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentItem({
  document,
  onDelete,
}: {
  document: AITrainingDocument;
  onDelete: (id: string) => void;
}) {
  const status = statusConfig[document.status];
  const StatusIcon = status.icon;

  const getIcon = () => {
    switch (document.content_type) {
      case "website":
        return <Globe className="w-4 h-4" />;
      case "document":
        return <Upload className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-lg bg-muted">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{document.title}</p>
          <p className="text-xs text-muted-foreground truncate">{document.content}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <StatusIcon className={`w-3 h-3 ${status.color === "bg-green-500" ? "text-green-500" : status.color === "bg-yellow-500" ? "text-yellow-500" : "text-red-500"}`} />
          {status.label}
        </Badge>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover treinamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este treinamento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(document.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
