import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuickResponses, QuickResponse } from "@/hooks/useQuickResponses";
import { Loader2, Plus, Search, Zap, Trash2, Edit, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function QuickResponsesManager() {
  const { responses, loading, createResponse, updateResponse, deleteResponse } = useQuickResponses();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<QuickResponse | null>(null);
  const [form, setForm] = useState({ shortcut: "", title: "", content: "" });

  const filteredResponses = responses.filter(
    (r) =>
      r.shortcut.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (response?: QuickResponse) => {
    if (response) {
      setEditingResponse(response);
      setForm({
        shortcut: response.shortcut,
        title: response.title,
        content: response.content,
      });
    } else {
      setEditingResponse(null);
      setForm({ shortcut: "", title: "", content: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.shortcut || !form.title || !form.content) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (editingResponse) {
      await updateResponse(editingResponse.id, form);
    } else {
      await createResponse(form);
    }
    setIsDialogOpen(false);
    setForm({ shortcut: "", title: "", content: "" });
    setEditingResponse(null);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copiado", description: "Texto copiado para a área de transferência" });
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Respostas Rápidas
            </CardTitle>
            <CardDescription>
              Crie atalhos para enviar respostas frequentes rapidamente
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Resposta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingResponse ? "Editar Resposta Rápida" : "Nova Resposta Rápida"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Atalho *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    <Input
                      value={form.shortcut}
                      onChange={(e) => setForm({ ...form, shortcut: e.target.value.replace(/\s/g, "") })}
                      placeholder="preco"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite /{form.shortcut || "atalho"} na conversa para usar
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Informação de preços"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo da Mensagem *</Label>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Digite a mensagem que será enviada..."
                    rows={5}
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingResponse ? "Salvar Alterações" : "Criar Resposta Rápida"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar respostas..."
            className="pl-10"
          />
        </div>

        {filteredResponses.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">
              {responses.length === 0
                ? "Nenhuma resposta rápida"
                : "Nenhuma resposta encontrada"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {responses.length === 0
                ? "Crie atalhos para agilizar suas respostas"
                : "Tente buscar com outros termos"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResponses.map((response) => (
              <div
                key={response.id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 rounded bg-primary/10 text-primary text-sm font-mono">
                        /{response.shortcut}
                      </code>
                      <span className="font-medium">{response.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(response.content)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(response)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteResponse(response.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {response.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
