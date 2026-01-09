import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, Trash2, Mail, MessageSquare, Copy, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  template_type: "whatsapp" | "email";
  category: string;
  subject?: string;
  created_at: string;
  updated_at: string;
}

interface ClientMessageTemplatesProps {
  onSelectTemplate?: (template: MessageTemplate) => void;
  filterType?: "whatsapp" | "email" | "all";
}

export function ClientMessageTemplates({ onSelectTemplate, filterType = "all" }: ClientMessageTemplatesProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    template_type: "whatsapp" as "whatsapp" | "email",
    category: "geral",
    subject: ""
  });

  useEffect(() => {
    fetchTemplates();
  }, [user?.id]);

  const fetchTemplates = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("consulting_message_templates" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as unknown as MessageTemplate[]);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !formData.name || !formData.content) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from("consulting_message_templates" as any)
          .update({
            name: formData.name,
            content: formData.content,
            template_type: formData.template_type,
            category: formData.category,
            subject: formData.template_type === "email" ? formData.subject : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast.success("Template atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("consulting_message_templates" as any)
          .insert({
            user_id: user.id,
            name: formData.name,
            content: formData.content,
            template_type: formData.template_type,
            category: formData.category,
            subject: formData.template_type === "email" ? formData.subject : null
          });

        if (error) throw error;
        toast.success("Template criado com sucesso!");
      }

      fetchTemplates();
      resetForm();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erro ao salvar template");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este template?")) return;

    try {
      const { error } = await supabase
        .from("consulting_message_templates" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Template excluído!");
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Erro ao excluir template");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      content: "",
      template_type: "whatsapp",
      category: "geral",
      subject: ""
    });
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      template_type: template.template_type,
      category: template.category,
      subject: template.subject || ""
    });
    setIsDialogOpen(true);
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredTemplates = templates.filter(t => 
    filterType === "all" || t.template_type === filterType
  );

  const categories = ["geral", "boas_vindas", "lembrete", "acompanhamento", "feedback", "agendamento"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Templates de Mensagens
            </CardTitle>
            <CardDescription>
              Modelos de mensagens para WhatsApp e E-mail
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Editar Template" : "Novo Template"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Template</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Boas-vindas Consultoria"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.template_type}
                      onValueChange={(v: "whatsapp" | "email") => setFormData({ ...formData, template_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-green-500" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-500" />
                            E-mail
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.template_type === "email" && (
                  <div className="space-y-2">
                    <Label>Assunto do E-mail</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Assunto do e-mail"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Conteúdo da Mensagem</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Digite o conteúdo da mensagem. Use {{nome}} para o nome do cliente, {{escritorio}} para o nome do escritório."
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variáveis disponíveis: {"{{nome}}"}, {"{{escritorio}}"}, {"{{email}}"}, {"{{telefone}}"}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingTemplate ? "Salvar" : "Criar Template"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTemplates.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum template criado ainda
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant={template.template_type === "whatsapp" ? "default" : "secondary"}>
                          {template.template_type === "whatsapp" ? (
                            <><MessageSquare className="w-3 h-3 mr-1" />WhatsApp</>
                          ) : (
                            <><Mail className="w-3 h-3 mr-1" />E-mail</>
                          )}
                        </Badge>
                        <Badge variant="outline">
                          {template.category.charAt(0).toUpperCase() + template.category.slice(1).replace("_", " ")}
                        </Badge>
                      </div>
                      {template.subject && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Assunto:</strong> {template.subject}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {onSelectTemplate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectTemplate(template)}
                        >
                          Usar
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCopy(template.content, template.id)}
                      >
                        {copied === template.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
