import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Tag, Trash2, Edit2 } from "lucide-react";
import { useWhatsAppContacts, ContactTag } from "@/hooks/useWhatsAppContacts";

const PRESET_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

export function TagsManager() {
  const { tags, loading, createTag, updateTag, deleteTag } = useWhatsAppContacts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ContactTag | null>(null);
  const [form, setForm] = useState({ name: "", color: "#3b82f6" });

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    if (editingTag) {
      await updateTag(editingTag.id, form);
    } else {
      await createTag(form);
    }
    
    setForm({ name: "", color: "#3b82f6" });
    setEditingTag(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (tag: ContactTag) => {
    setEditingTag(tag);
    setForm({ name: tag.name, color: tag.color || "#3b82f6" });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tagId: string) => {
    if (confirm("Tem certeza que deseja excluir esta tag?")) {
      await deleteTag(tagId);
    }
  };

  const handleClose = () => {
    setForm({ name: "", color: "#3b82f6" });
    setEditingTag(null);
    setIsDialogOpen(false);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Gerenciador de Tags
          </CardTitle>
          <CardDescription>
            Crie e gerencie tags para organizar seus contatos
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? "Editar Tag" : "Nova Tag"}</DialogTitle>
              <DialogDescription>
                {editingTag ? "Atualize os dados da tag" : "Crie uma nova tag para organizar seus contatos"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Tag</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Cliente VIP, Interessado, Novo Lead"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        form.color === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Label className="text-sm">Cor personalizada:</Label>
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-16 h-8 p-1 cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Label>Preview:</Label>
                <Badge style={{ backgroundColor: form.color }} className="text-white">
                  {form.name || "Nome da Tag"}
                </Badge>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!form.name.trim()}>
                {editingTag ? "Salvar" : "Criar Tag"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhuma tag criada</p>
            <p className="text-sm">Crie tags para organizar seus contatos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color || "#3b82f6" }}
                  />
                  <span className="font-medium">{tag.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(tag)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tag.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
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
