import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMessageTemplates, MessageTemplate } from "@/hooks/useMessageTemplates";
import { Plus, FileText, Image, File, Trash2, Edit, Send } from "lucide-react";

interface MessageTemplatesManagerProps {
  onSelectTemplate?: (template: MessageTemplate) => void;
  showSelectButton?: boolean;
}

export function MessageTemplatesManager({ onSelectTemplate, showSelectButton = false }: MessageTemplatesManagerProps) {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useMessageTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    file_url: "",
    file_type: "text" as string,
    file_name: "",
    category: "geral",
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, formData);
    } else {
      await createTemplate(formData);
    }

    setFormData({ name: "", content: "", file_url: "", file_type: "text", file_name: "", category: "geral" });
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content || "",
      file_url: template.file_url || "",
      file_type: template.file_type || "text",
      file_name: template.file_name || "",
      category: template.category || "geral",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este template?")) {
      await deleteTemplate(id);
    }
  };

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case "image": return <Image className="h-4 w-4" />;
      case "document": return <File className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const categories = ["geral", "vendas", "suporte", "boas-vindas", "follow-up"];

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando templates...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Templates de Mensagens</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => {
              setEditingTemplate(null);
              setFormData({ name: "", content: "", file_url: "", file_type: "text", file_name: "", category: "geral" });
            }}>
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Template</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Boas-vindas"
                />
              </div>

              <div>
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select value={formData.file_type} onValueChange={(v) => setFormData({ ...formData, file_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.file_type === "text" ? (
                <div>
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Digite o texto do template..."
                    rows={4}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label>URL do Arquivo</Label>
                    <Input
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Nome do Arquivo</Label>
                    <Input
                      value={formData.file_name}
                      onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                      placeholder="documento.pdf"
                    />
                  </div>
                  <div>
                    <Label>Legenda (opcional)</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Texto que acompanha o arquivo..."
                      rows={2}
                    />
                  </div>
                </>
              )}

              <Button onClick={handleSubmit} className="w-full">
                {editingTemplate ? "Salvar Alterações" : "Criar Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum template criado ainda
          </p>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    {getTypeIcon(template.file_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{template.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                      {template.content && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {template.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {showSelectButton && onSelectTemplate && (
                    <Button size="icon" variant="ghost" onClick={() => onSelectTemplate(template)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
