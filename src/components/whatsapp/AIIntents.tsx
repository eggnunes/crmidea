import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Target,
  Plus,
  Trash2,
  Edit,
  Link as LinkIcon,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useAIIntents, AIIntent } from "@/hooks/useAIIntents";

const actionTypes = [
  { value: "link", label: "Abrir Link", icon: LinkIcon, description: "Redireciona para uma URL" },
  { value: "message", label: "Enviar Mensagem", icon: MessageSquare, description: "Envia uma mensagem personalizada" },
  { value: "api_call", label: "Chamar API", icon: Zap, description: "Executa uma chamada de API" },
];

export function AIIntents() {
  const { intents, loading, addIntent, updateIntent, deleteIntent } = useAIIntents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIntent, setEditingIntent] = useState<AIIntent | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    intent_name: "",
    trigger_phrases: "",
    action_type: "link" as "link" | "message" | "api_call",
    action_value: "",
    description: "",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      intent_name: "",
      trigger_phrases: "",
      action_type: "link",
      action_value: "",
      description: "",
      is_active: true,
    });
    setEditingIntent(null);
  };

  const handleOpenDialog = (intent?: AIIntent) => {
    if (intent) {
      setEditingIntent(intent);
      setFormData({
        intent_name: intent.intent_name,
        trigger_phrases: intent.trigger_phrases.join(", "),
        action_type: intent.action_type,
        action_value: intent.action_value,
        description: intent.description || "",
        is_active: intent.is_active,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const phrases = formData.trigger_phrases
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);

    if (!formData.intent_name || phrases.length === 0 || !formData.action_value) {
      return;
    }

    setSaving(true);
    
    const intentData = {
      intent_name: formData.intent_name,
      trigger_phrases: phrases,
      action_type: formData.action_type,
      action_value: formData.action_value,
      description: formData.description || null,
      is_active: formData.is_active,
    };

    if (editingIntent) {
      await updateIntent(editingIntent.id, intentData);
    } else {
      await addIntent(intentData);
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
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
              <Target className="w-5 h-5" />
              Intenções
            </CardTitle>
            <CardDescription>
              Intenções são comandos personalizados que acionam ações específicas em serviços externos
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Intenção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingIntent ? "Editar Intenção" : "Criar Intenção"}
                </DialogTitle>
                <DialogDescription>
                  Configure uma ação que será acionada quando o usuário mencionar frases específicas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="intent_name">Nome da intenção</Label>
                  <Input
                    id="intent_name"
                    value={formData.intent_name}
                    onChange={(e) => setFormData({ ...formData, intent_name: e.target.value })}
                    placeholder="Ex: Agendar mentoria"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trigger_phrases">Frases gatilho</Label>
                  <Textarea
                    id="trigger_phrases"
                    value={formData.trigger_phrases}
                    onChange={(e) => setFormData({ ...formData, trigger_phrases: e.target.value })}
                    placeholder="quero agendar, marcar mentoria, agendar reunião"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separe as frases por vírgula. Quando o usuário mencionar qualquer uma delas, a ação será acionada.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de ação</Label>
                  <Select
                    value={formData.action_type}
                    onValueChange={(value: any) => setFormData({ ...formData, action_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="action_value">
                    {formData.action_type === "link"
                      ? "URL do link"
                      : formData.action_type === "message"
                      ? "Mensagem a enviar"
                      : "Endpoint da API"}
                  </Label>
                  <Input
                    id="action_value"
                    value={formData.action_value}
                    onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
                    placeholder={
                      formData.action_type === "link"
                        ? "https://calendly.com/..."
                        : formData.action_type === "message"
                        ? "Mensagem que será enviada..."
                        : "https://api.exemplo.com/..."
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descrição do que essa intenção faz"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Ativo</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingIntent ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {intents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Target className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Criar uma intenção</p>
              <p className="text-sm text-center max-w-sm mt-2">
                Intenções são comandos personalizados que acionam ações específicas em serviços
                externos, como "solicitar segunda via de um boleto".
              </p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeira intenção
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {intents.map((intent) => {
                const actionType = actionTypes.find((t) => t.value === intent.action_type);
                const ActionIcon = actionType?.icon || Zap;

                return (
                  <div
                    key={intent.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ActionIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{intent.intent_name}</span>
                          {!intent.is_active && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Gatilhos: {intent.trigger_phrases.join(", ")}
                        </p>
                        {intent.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {intent.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(intent)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover intenção?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover a intenção "{intent.intent_name}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteIntent(intent.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
