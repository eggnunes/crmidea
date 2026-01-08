import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Loader2,
  Save,
  Eye,
  EyeOff,
  HelpCircle,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FormField {
  id: string;
  user_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options: string[] | null;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "number", label: "Número" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "select", label: "Seleção única" },
  { value: "multiselect", label: "Múltipla escolha" },
  { value: "checkbox", label: "Sim/Não" },
  { value: "radio", label: "Opções (radio)" },
  { value: "date", label: "Data" },
];

// Sortable item component
function SortableField({ 
  field, 
  onEdit, 
  onDelete, 
  onToggleRequired 
}: { 
  field: FormField; 
  onEdit: () => void; 
  onDelete: () => void;
  onToggleRequired: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldTypeLabel = FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border rounded-lg group hover:border-primary/50"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{field.field_label}</span>
          {field.is_required && (
            <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Badge variant="outline" className="text-xs">{fieldTypeLabel}</Badge>
          <span className="text-xs">({field.field_name})</span>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRequired}
          title={field.is_required ? "Tornar opcional" : "Tornar obrigatório"}
        >
          {field.is_required ? (
            <Eye className="w-4 h-4 text-primary" />
          ) : (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function DiagnosticFormManager() {
  const { user } = useAuth();
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [deletingField, setDeletingField] = useState<FormField | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    field_name: "",
    field_label: "",
    field_type: "text",
    field_options: "",
    is_required: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchFields = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_form_fields")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      
      setFields(data?.map(f => ({
        ...f,
        field_options: f.field_options as string[] | null,
        is_required: f.is_required ?? false,
        order_index: f.order_index ?? 0,
      })) || []);
    } catch (error) {
      console.error("Error fetching fields:", error);
      toast.error("Erro ao carregar campos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [user?.id]);

  const openCreateDialog = () => {
    setEditingField(null);
    setFormData({
      field_name: "",
      field_label: "",
      field_type: "text",
      field_options: "",
      is_required: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (field: FormField) => {
    setEditingField(field);
    setFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      field_options: field.field_options?.join("\n") || "",
      is_required: field.is_required,
    });
    setIsDialogOpen(true);
  };

  const generateFieldName = (label: string) => {
    return label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 50);
  };

  const handleLabelChange = (label: string) => {
    setFormData(prev => ({
      ...prev,
      field_label: label,
      field_name: prev.field_name || generateFieldName(label),
    }));
  };

  const handleSaveField = async () => {
    if (!user?.id) return;

    if (!formData.field_name.trim() || !formData.field_label.trim()) {
      toast.error("Preencha o nome e o rótulo do campo");
      return;
    }

    setSaving(true);
    try {
      const fieldOptions = formData.field_options
        .split("\n")
        .map(o => o.trim())
        .filter(o => o.length > 0);

      if (editingField) {
        // Update existing field
        const { error } = await supabase
          .from("client_form_fields")
          .update({
            field_name: formData.field_name.trim(),
            field_label: formData.field_label.trim(),
            field_type: formData.field_type,
            field_options: fieldOptions.length > 0 ? fieldOptions : null,
            is_required: formData.is_required,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingField.id);

        if (error) throw error;
        toast.success("Campo atualizado com sucesso!");
      } else {
        // Create new field
        const maxOrder = fields.length > 0 ? Math.max(...fields.map(f => f.order_index)) : -1;
        
        const { error } = await supabase
          .from("client_form_fields")
          .insert({
            user_id: user.id,
            field_name: formData.field_name.trim(),
            field_label: formData.field_label.trim(),
            field_type: formData.field_type,
            field_options: fieldOptions.length > 0 ? fieldOptions : null,
            is_required: formData.is_required,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success("Campo criado com sucesso!");
      }

      setIsDialogOpen(false);
      fetchFields();
    } catch (error) {
      console.error("Error saving field:", error);
      toast.error("Erro ao salvar campo");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async () => {
    if (!deletingField) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("client_form_fields")
        .delete()
        .eq("id", deletingField.id);

      if (error) throw error;
      
      toast.success("Campo excluído com sucesso!");
      setDeletingField(null);
      fetchFields();
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Erro ao excluir campo");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRequired = async (field: FormField) => {
    try {
      const { error } = await supabase
        .from("client_form_fields")
        .update({ 
          is_required: !field.is_required,
          updated_at: new Date().toISOString(),
        })
        .eq("id", field.id);

      if (error) throw error;
      
      setFields(prev => prev.map(f => 
        f.id === field.id ? { ...f, is_required: !f.is_required } : f
      ));
      toast.success(field.is_required ? "Campo agora é opcional" : "Campo agora é obrigatório");
    } catch (error) {
      console.error("Error toggling required:", error);
      toast.error("Erro ao atualizar campo");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);

      const newFields = arrayMove(fields, oldIndex, newIndex);
      setFields(newFields);

      // Update order in database
      try {
        for (let i = 0; i < newFields.length; i++) {
          await supabase
            .from("client_form_fields")
            .update({ order_index: i })
            .eq("id", newFields[i].id);
        }
      } catch (error) {
        console.error("Error updating order:", error);
        toast.error("Erro ao reordenar campos");
        fetchFields(); // Revert on error
      }
    }
  };

  const needsOptions = ["select", "multiselect", "radio"].includes(formData.field_type);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Campos Personalizados do Formulário
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova perguntas do formulário de diagnóstico.
                Arraste para reordenar.
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Campo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhum campo personalizado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione campos personalizados ao seu formulário de diagnóstico
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Campo
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <SortableField
                        key={field.id}
                        field={field}
                        onEdit={() => openEditDialog(field)}
                        onDelete={() => setDeletingField(field)}
                        onToggleRequired={() => handleToggleRequired(field)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                Sobre os campos personalizados
              </p>
              <p className="text-blue-700 dark:text-blue-400">
                Os campos criados aqui serão exibidos no formulário de diagnóstico preenchido pelos clientes.
                Os campos padrão (nome, email, escritório, etc.) sempre serão exibidos e não podem ser removidos.
                Use esta seção para adicionar perguntas específicas para sua consultoria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Editar Campo" : "Novo Campo"}
            </DialogTitle>
            <DialogDescription>
              {editingField 
                ? "Atualize as configurações do campo" 
                : "Configure o novo campo do formulário"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field_label">Rótulo (pergunta) *</Label>
              <Input
                id="field_label"
                value={formData.field_label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Ex: Quantos processos ativos você tem?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_name">Nome do campo (interno)</Label>
              <Input
                id="field_name"
                value={formData.field_name}
                onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                placeholder="Ex: processos_ativos"
              />
              <p className="text-xs text-muted-foreground">
                Identificador único do campo (sem espaços ou caracteres especiais)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_type">Tipo de campo</Label>
              <Select
                value={formData.field_type}
                onValueChange={(value) => setFormData({ ...formData, field_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsOptions && (
              <div className="space-y-2">
                <Label htmlFor="field_options">Opções (uma por linha)</Label>
                <Textarea
                  id="field_options"
                  value={formData.field_options}
                  onChange={(e) => setFormData({ ...formData, field_options: e.target.value })}
                  placeholder={"Opção 1\nOpção 2\nOpção 3"}
                  rows={4}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Campo obrigatório</Label>
                <p className="text-xs text-muted-foreground">
                  O cliente deve preencher este campo
                </p>
              </div>
              <Switch
                checked={formData.is_required}
                onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveField} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {editingField ? "Salvar" : "Criar Campo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingField} onOpenChange={() => setDeletingField(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Campo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o campo "{deletingField?.field_label}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteField}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
