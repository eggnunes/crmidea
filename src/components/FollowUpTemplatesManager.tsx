import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFollowUpTemplates, FollowUpTemplateInsert } from '@/hooks/useFollowUpTemplates';
import { PRODUCTS, STATUSES } from '@/types/crm';
import { Plus, Edit, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function FollowUpTemplatesManager() {
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } = useFollowUpTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState<FollowUpTemplateInsert>({
    name: '',
    description: '',
    min_days: 3,
    max_days: 7,
    status_filter: [],
    product_filter: [],
    message_template: '',
    priority: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      min_days: 3,
      max_days: 7,
      status_filter: [],
      product_filter: [],
      message_template: '',
      priority: 0,
      is_active: true,
    });
    setEditingTemplate(null);
  };

  const handleOpenDialog = (templateId?: string) => {
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setFormData({
          name: template.name,
          description: template.description || '',
          min_days: template.min_days,
          max_days: template.max_days,
          status_filter: template.status_filter,
          product_filter: template.product_filter,
          message_template: template.message_template,
          priority: template.priority,
          is_active: template.is_active,
        });
        setEditingTemplate(templateId);
      }
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.message_template) {
      toast.error('Nome e mensagem são obrigatórios');
      return;
    }

    if (editingTemplate) {
      await updateTemplate(editingTemplate, formData);
    } else {
      await addTemplate(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      await deleteTemplate(id);
    }
  };

  const toggleStatus = (status: string) => {
    setFormData(prev => ({
      ...prev,
      status_filter: prev.status_filter.includes(status)
        ? prev.status_filter.filter(s => s !== status)
        : [...prev.status_filter, status],
    }));
  };

  const toggleProduct = (product: string) => {
    setFormData(prev => ({
      ...prev,
      product_filter: prev.product_filter.includes(product)
        ? prev.product_filter.filter(p => p !== product)
        : [...prev.product_filter, product],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Follow-up</h3>
          <p className="text-sm text-muted-foreground">
            Configure mensagens automáticas baseadas em dias sem interação
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template de Follow-up'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do Template</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Follow-up inicial"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do template"
                  />
                </div>
                <div>
                  <Label>Dias mínimos sem interação</Label>
                  <Input
                    type="number"
                    value={formData.min_days}
                    onChange={e => setFormData({ ...formData, min_days: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                <div>
                  <Label>Dias máximos sem interação</Label>
                  <Input
                    type="number"
                    value={formData.max_days}
                    onChange={e => setFormData({ ...formData, max_days: parseInt(e.target.value) || 7 })}
                    min={1}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Aplicar a leads com status (vazio = todos)</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.filter(s => !s.id.includes('fechado')).map(status => (
                    <Badge
                      key={status.id}
                      variant={formData.status_filter.includes(status.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(status.id)}
                    >
                      {status.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Aplicar a produtos (vazio = todos)</Label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCTS.slice(0, 8).map(product => (
                    <Badge
                      key={product.id}
                      variant={formData.product_filter.includes(product.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleProduct(product.id)}
                    >
                      {product.shortName}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Mensagem de Follow-up</Label>
                <Textarea
                  value={formData.message_template}
                  onChange={e => setFormData({ ...formData, message_template: e.target.value })}
                  placeholder="Olá {nome}! Passando para saber se você teve alguma dúvida sobre o {produto}..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variáveis: {'{nome}'} = primeiro nome do lead, {'{produto}'} = nome do produto
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridade (menor = primeiro)</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Template ativo</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTemplate ? 'Salvar' : 'Criar Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h4 className="font-semibold mb-2">Nenhum template configurado</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Crie templates para enviar mensagens automáticas de follow-up
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map(template => (
            <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {!template.is_active && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template.id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  {template.min_days} - {template.max_days} dias sem interação
                </div>
                <p className="text-sm bg-secondary/50 p-3 rounded-lg whitespace-pre-wrap">
                  {template.message_template.substring(0, 150)}
                  {template.message_template.length > 150 && '...'}
                </p>
                {(template.status_filter.length > 0 || template.product_filter.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.status_filter.map(s => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {STATUSES.find(st => st.id === s)?.name || s}
                      </Badge>
                    ))}
                    {template.product_filter.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {PRODUCTS.find(pr => pr.id === p)?.shortName || p}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
