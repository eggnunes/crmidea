import { useState } from "react";
import { PRODUCTS, STATUSES, Lead, ProductType, LeadStatus } from "@/types/crm";
import { useLeadsStore } from "@/store/leadsStore";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  Trash2,
  Eye,
  Edit
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function LeadForm({ 
  onSubmit, 
  onClose,
  initialData 
}: { 
  onSubmit: (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>) => void;
  onClose: () => void;
  initialData?: Lead;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    product: initialData?.product || '' as ProductType,
    status: initialData?.status || 'novo' as LeadStatus,
    value: initialData?.value || 0,
    source: initialData?.source || '',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.product) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    onSubmit(formData as Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Dr. João Silva"
          />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div>
          <Label htmlFor="product">Produto de Interesse *</Label>
          <Select
            value={formData.product}
            onValueChange={(value) => setFormData({ ...formData, product: value as ProductType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCTS.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as LeadStatus })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(status => (
                <SelectItem key={status.id} value={status.id}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="value">Valor (R$)</Label>
          <Input
            id="value"
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="source">Origem</Label>
          <Input
            id="source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="Instagram, YouTube, Indicação..."
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notas sobre o lead..."
            rows={3}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Salvar' : 'Adicionar Lead'}
        </Button>
      </div>
    </form>
  );
}

function LeadDetailDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { addInteraction } = useLeadsStore();
  const [newInteraction, setNewInteraction] = useState({
    type: 'whatsapp' as const,
    description: ''
  });

  const product = PRODUCTS.find(p => p.id === lead.product);
  const status = STATUSES.find(s => s.id === lead.status);

  const handleAddInteraction = () => {
    if (!newInteraction.description) {
      toast.error('Descreva a interação');
      return;
    }
    addInteraction(lead.id, {
      date: new Date().toISOString().split('T')[0],
      type: newInteraction.type,
      description: newInteraction.description
    });
    setNewInteraction({ type: 'whatsapp', description: '' });
    toast.success('Interação adicionada');
  };

  return (
    <div className="space-y-6">
      {/* Lead Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-xl font-bold text-foreground">
              {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold">{lead.name}</h3>
            <p className="text-muted-foreground">{product?.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">E-mail:</span>
            <p className="font-medium">{lead.email || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Telefone:</span>
            <p className="font-medium">{lead.phone || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Valor:</span>
            <p className="font-medium">R$ {lead.value.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Origem:</span>
            <p className="font-medium">{lead.source || '-'}</p>
          </div>
        </div>

        {lead.notes && (
          <div>
            <span className="text-muted-foreground text-sm">Observações:</span>
            <p className="text-sm mt-1">{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Interactions */}
      <div className="border-t border-border pt-4">
        <h4 className="font-semibold mb-3">Histórico de Interações</h4>
        
        {/* Add Interaction */}
        <div className="flex gap-2 mb-4">
          <Select
            value={newInteraction.type}
            onValueChange={(value: any) => setNewInteraction({ ...newInteraction, type: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="ligacao">Ligação</SelectItem>
              <SelectItem value="reuniao">Reunião</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={newInteraction.description}
            onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
            placeholder="Descreva a interação..."
            className="flex-1"
          />
          <Button onClick={handleAddInteraction} size="sm">
            Adicionar
          </Button>
        </div>

        {/* Interaction List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {lead.interactions.length > 0 ? (
            [...lead.interactions].reverse().map(interaction => (
              <div key={interaction.id} className="p-3 bg-secondary/50 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {interaction.type}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{interaction.date}</span>
                </div>
                <p>{interaction.description}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhuma interação registrada
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead } = useLeadsStore();
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    const matchesProduct = filterProduct === 'all' || lead.product === filterProduct;
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesProduct && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    info: "bg-info/10 text-info border-info/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    mentoria: "bg-mentoria/10 text-mentoria border-mentoria/20",
    success: "bg-success/10 text-success border-success/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20"
  };

  const handleAddLead = (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>) => {
    addLead(data);
    toast.success('Lead adicionado com sucesso!');
  };

  const handleEditLead = (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>) => {
    if (editingLead) {
      updateLead(editingLead.id, data);
      toast.success('Lead atualizado com sucesso!');
      setEditingLead(null);
    }
  };

  const handleDeleteLead = (id: string) => {
    deleteLead(id);
    toast.success('Lead removido');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus potenciais clientes</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Lead</DialogTitle>
            </DialogHeader>
            <LeadForm 
              onSubmit={handleAddLead} 
              onClose={() => setIsAddDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="pl-10"
              />
            </div>
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {PRODUCTS.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUSES.map(status => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="text-left p-4 font-semibold text-sm">Lead</th>
                <th className="text-left p-4 font-semibold text-sm">Contato</th>
                <th className="text-left p-4 font-semibold text-sm">Produto</th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Valor</th>
                <th className="text-right p-4 font-semibold text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length > 0 ? (
                filteredLeads.map(lead => {
                  const product = PRODUCTS.find(p => p.id === lead.product);
                  const status = STATUSES.find(s => s.id === lead.status);
                  
                  return (
                    <tr 
                      key={lead.id} 
                      className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.source}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {lead.phone && (
                            <a 
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {lead.email && (
                            <a 
                              href={`mailto:${lead.email}`}
                              className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{product?.shortName}</span>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant="outline"
                          className={cn("text-xs", statusColors[status?.color || 'primary'])}
                        >
                          {status?.name}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">
                          R$ {lead.value.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingLead(lead)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteLead(lead.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum lead encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLead} onOpenChange={() => setEditingLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <LeadForm 
              initialData={editingLead}
              onSubmit={handleEditLead} 
              onClose={() => setEditingLead(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingLead} onOpenChange={() => setViewingLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {viewingLead && (
            <LeadDetailDialog lead={viewingLead} onClose={() => setViewingLead(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
