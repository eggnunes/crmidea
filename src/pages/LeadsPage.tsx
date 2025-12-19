import { useState, useEffect } from "react";
import { PRODUCTS, STATUSES, Lead, ProductType, LeadStatus, Interaction } from "@/types/crm";
import { useLeads } from "@/hooks/useLeads";
import { useLeadProducts } from "@/hooks/useLeadProducts";
import { useClients } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Search, 
  Filter, 
  Phone,
  Mail,
  Trash2,
  Eye,
  Edit,
  Loader2,
  MoreHorizontal,
  Package,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  UserCheck
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
  DropdownMenuSeparator,
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
import { ExportImportLeads } from "@/components/ExportImportLeads";
import { LeadAssignees } from "@/components/LeadAssignees";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { StartConversationButton } from "@/components/whatsapp/StartConversationButton";
import { useNavigate } from "react-router-dom";
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

function LeadDetailDialog({ 
  lead, 
  onAddInteraction,
  onUpdateLead
}: { 
  lead: Lead; 
  onAddInteraction: (leadId: string, interaction: Omit<Interaction, 'id'>) => void;
  onUpdateLead: (leadId: string, data: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>>) => Promise<void>;
}) {
  const [newInteraction, setNewInteraction] = useState({
    type: 'whatsapp' as Interaction['type'],
    description: ''
  });
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(lead.status);
  const [statusReason, setStatusReason] = useState('');
  
  // New product form state
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductData, setNewProductData] = useState({
    product: '' as ProductType,
    status: 'novo' as LeadStatus,
    value: 0
  });
  const [showProducts, setShowProducts] = useState(true);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductStatus, setEditingProductStatus] = useState<LeadStatus>('novo');

  // Use the lead products hook
  const { leadProducts, loading: loadingProducts, addLeadProduct, updateLeadProduct, deleteLeadProduct } = useLeadProducts(lead.id);

  const product = PRODUCTS.find(p => p.id === lead.product);
  const status = STATUSES.find(s => s.id === lead.status);

  const handleAddInteraction = () => {
    if (!newInteraction.description) {
      toast.error('Descreva a interação');
      return;
    }
    onAddInteraction(lead.id, {
      date: new Date().toISOString().split('T')[0],
      type: newInteraction.type,
      description: newInteraction.description
    });
    setNewInteraction({ type: 'whatsapp', description: '' });
  };

  const handleStatusChange = async () => {
    if (selectedStatus === lead.status && !statusReason) {
      setIsChangingStatus(false);
      return;
    }

    try {
      await onUpdateLead(lead.id, { status: selectedStatus });
      
      if (statusReason) {
        onAddInteraction(lead.id, {
          date: new Date().toISOString().split('T')[0],
          type: 'outro',
          description: `Status alterado para "${STATUSES.find(s => s.id === selectedStatus)?.name}": ${statusReason}`
        });
      }
      
      toast.success('Status atualizado com sucesso');
      setIsChangingStatus(false);
      setStatusReason('');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleAddNewProduct = async () => {
    if (!newProductData.product) {
      toast.error('Selecione um produto');
      return;
    }

    const productName = PRODUCTS.find(p => p.id === newProductData.product)?.name;
    const statusName = STATUSES.find(s => s.id === newProductData.status)?.name;

    const result = await addLeadProduct({
      product: newProductData.product,
      status: newProductData.status,
      value: newProductData.value
    });

    if (result) {
      onAddInteraction(lead.id, {
        date: new Date().toISOString().split('T')[0],
        type: 'outro',
        description: `Novo produto adicionado: "${productName}" - Fase: ${statusName}`
      });
      
      setIsAddingProduct(false);
      setNewProductData({ product: '' as ProductType, status: 'novo', value: 0 });
    }
  };

  const handleUpdateProductStatus = async (productId: string, newStatus: LeadStatus) => {
    const productItem = leadProducts.find(p => p.id === productId);
    if (!productItem) return;

    const productName = PRODUCTS.find(p => p.id === productItem.product)?.name;
    const statusName = STATUSES.find(s => s.id === newStatus)?.name;

    const success = await updateLeadProduct(productId, { status: newStatus });
    
    if (success) {
      onAddInteraction(lead.id, {
        date: new Date().toISOString().split('T')[0],
        type: 'outro',
        description: `Produto "${productName}" movido para fase: ${statusName}`
      });
      setEditingProductId(null);
    }
  };

  const statusColors: Record<string, string> = {
    info: "bg-info/10 text-info border-info/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    mentoria: "bg-mentoria/10 text-mentoria border-mentoria/20",
    success: "bg-success/10 text-success border-success/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20"
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Lead Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-xl font-bold text-foreground">
              {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{lead.name}</h3>
            <p className="text-muted-foreground text-sm">{lead.email}</p>
          </div>
        </div>

        {/* Products Section */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowProducts(!showProducts)}
            className="w-full p-3 bg-secondary/30 flex items-center justify-between hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="font-semibold text-sm">Produtos ({leadProducts.length})</span>
            </div>
            {showProducts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showProducts && (
            <div className="p-3 space-y-3">
              {loadingProducts ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* List existing products */}
                  {leadProducts.map(lp => {
                    const productInfo = PRODUCTS.find(p => p.id === lp.product);
                    const statusInfo = STATUSES.find(s => s.id === lp.status);
                    const isEditing = editingProductId === lp.id;

                    return (
                      <div key={lp.id} className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{productInfo?.name}</p>
                            {lp.value > 0 && (
                              <p className="text-xs text-muted-foreground">
                                R$ {lp.value.toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={editingProductStatus}
                                  onValueChange={(value) => setEditingProductStatus(value as LeadStatus)}
                                >
                                  <SelectTrigger className="w-40 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUSES.map(s => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 px-2"
                                  onClick={() => setEditingProductId(null)}
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="h-8 px-2"
                                  onClick={() => handleUpdateProductStatus(lp.id, editingProductStatus)}
                                >
                                  Salvar
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs cursor-pointer hover:opacity-80", statusColors[statusInfo?.color || 'primary'])}
                                  onClick={() => {
                                    setEditingProductId(lp.id);
                                    setEditingProductStatus(lp.status);
                                  }}
                                >
                                  {statusInfo?.name}
                                  <Edit className="w-3 h-3 ml-1" />
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => deleteLeadProduct(lp.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add new product form */}
                  {isAddingProduct ? (
                    <div className="p-3 border border-dashed border-border rounded-lg space-y-3">
                      <div>
                        <Label className="text-xs">Produto</Label>
                        <Select
                          value={newProductData.product}
                          onValueChange={(value) => setNewProductData({ ...newProductData, product: value as ProductType })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCTS.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Fase inicial</Label>
                        <Select
                          value={newProductData.status}
                          onValueChange={(value) => setNewProductData({ ...newProductData, status: value as LeadStatus })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Valor (R$)</Label>
                        <Input
                          type="number"
                          value={newProductData.value}
                          onChange={(e) => setNewProductData({ ...newProductData, value: Number(e.target.value) })}
                          className="h-9"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingProduct(false);
                            setNewProductData({ product: '' as ProductType, status: 'novo', value: 0 });
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={handleAddNewProduct}>
                          Adicionar Produto
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setIsAddingProduct(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Novo Produto
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Original Product/Status (legacy) */}
        <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Produto principal (original)</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{product?.name}</span>
            {isChangingStatus ? (
              <div className="flex-1 ml-4 space-y-2">
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as LeadStatus)}
                >
                  <SelectTrigger className="w-full h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Motivo da alteração (opcional)"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setIsChangingStatus(false);
                    setSelectedStatus(lead.status);
                    setStatusReason('');
                  }}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleStatusChange}>
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsChangingStatus(true)}
              >
                <Badge variant="outline" className={cn("text-xs", statusColors[status?.color || 'primary'])}>
                  {status?.name}
                </Badge>
                <Edit className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Telefone:</span>
            <p className="font-medium">{lead.phone || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Origem:</span>
            <p className="font-medium">{lead.source || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data de Aquisição:</span>
            <p className="font-medium">
              {new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Última Atualização:</span>
            <p className="font-medium">
              {new Date(lead.updatedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {lead.notes && (
          <div>
            <span className="text-muted-foreground text-sm">Observações:</span>
            <p className="text-sm mt-1">{lead.notes}</p>
          </div>
        )}

        {/* Lead Assignees */}
        <div className="border-t border-border pt-4">
          <LeadAssignees leadId={lead.id} />
        </div>
      </div>

      {/* Interactions */}
      <div className="border-t border-border pt-4">
        <h4 className="font-semibold mb-3">Histórico de Interações</h4>
        
        {/* Add Interaction */}
        <div className="flex gap-2 mb-4">
          <Select
            value={newInteraction.type}
            onValueChange={(value: Interaction['type']) => setNewInteraction({ ...newInteraction, type: value })}
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
  const { leads, loading, addLead, updateLead, deleteLead, addInteraction, importLeads } = useLeads();
  const { addClient } = useClients();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [conversationPhones, setConversationPhones] = useState<Set<string>>(new Set());

  // Fetch phones that have active conversations
  useEffect(() => {
    const fetchConversationPhones = async () => {
      const { data } = await supabase
        .from('whatsapp_conversations')
        .select('contact_phone');
      
      if (data) {
        const phones = new Set(data.map(c => c.contact_phone.replace(/\D/g, '')));
        setConversationPhones(phones);
      }
    };
    fetchConversationPhones();
  }, []);

  const hasActiveConversation = (phone: string | null) => {
    if (!phone) return false;
    const cleanPhone = phone.replace(/\D/g, '');
    return conversationPhones.has(cleanPhone);
  };

  const handleConversationStarted = (conversationId: string) => {
    navigate(`/whatsapp?conversation=${conversationId}`);
  };

  const handleConvertToClient = async (lead: Lead) => {
    try {
      const client = await addClient({
        lead_id: lead.id,
        name: lead.name,
        email: lead.email || null,
        phone: lead.phone || null,
        product_type: lead.product,
        contract_start_date: new Date().toISOString().split('T')[0],
        contract_value: lead.value || 0,
        status: 'ativo',
        payment_status: 'pendente',
      });

      if (client) {
        // Update lead status to closed/won
        await updateLead(lead.id, { status: 'fechado-ganho' });
        toast.success('Lead convertido em cliente com sucesso!');
        navigate('/clientes');
      }
    } catch (error) {
      toast.error('Erro ao converter lead em cliente');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    const matchesProduct = filterProduct === 'all' || lead.product === filterProduct;
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    
    // Date filter
    let matchesDate = true;
    if (startDate || endDate) {
      const leadDate = new Date(lead.createdAt);
      if (startDate && endDate) {
        matchesDate = isWithinInterval(leadDate, { 
          start: startOfDay(startDate), 
          end: endOfDay(endDate) 
        });
      } else if (startDate) {
        matchesDate = leadDate >= startOfDay(startDate);
      } else if (endDate) {
        matchesDate = leadDate <= endOfDay(endDate);
      }
    }
    
    return matchesSearch && matchesProduct && matchesStatus && matchesDate;
  });

  const handleDateChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
  };

  const statusColors: Record<string, string> = {
    info: "bg-info/10 text-info border-info/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    mentoria: "bg-mentoria/10 text-mentoria border-mentoria/20",
    success: "bg-success/10 text-success border-success/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20"
  };

  const handleAddLead = async (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>) => {
    await addLead(data);
  };

  const handleEditLead = async (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>) => {
    if (editingLead) {
      await updateLead(editingLead.id, data);
      setEditingLead(null);
    }
  };

  const handleDeleteLead = async (id: string) => {
    await deleteLead(id);
  };

  const handleImport = async (leadsToImport: (Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'> & { importedCreatedAt?: string })[]) => {
    await importLeads(leadsToImport);
  };

  // Bulk selection functions
  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const selectedArray = Array.from(selectedLeads);
      for (const leadId of selectedArray) {
        await deleteLead(leadId);
      }
      toast.success(`${selectedArray.length} leads excluídos com sucesso`);
      setSelectedLeads(new Set());
    } catch (error) {
      toast.error('Erro ao excluir alguns leads');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus potenciais clientes</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {selectedLeads.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir {selectedLeads.size} selecionado{selectedLeads.size > 1 ? 's' : ''}
            </Button>
          )}
          <ExportImportLeads leads={filteredLeads} onImport={handleImport} />
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
      </div>

      {/* Filters */}
      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
              />
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
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="p-4 w-12">
                  <Checkbox 
                    checked={filteredLeads.length > 0 && selectedLeads.size === filteredLeads.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </th>
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
                  const isSelected = selectedLeads.has(lead.id);
                  
                  return (
                    <tr 
                      key={lead.id} 
                      className={cn(
                        "border-b border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer",
                        isSelected && "bg-primary/5"
                      )}
                      onClick={(e) => {
                        // Don't open details if clicking on interactive elements
                        const target = e.target as HTMLElement;
                        if (target.closest('button, a, input, [role="checkbox"]')) return;
                        setViewingLead(lead);
                      }}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectLead(lead.id)}
                          aria-label={`Selecionar ${lead.name}`}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                              <span className="text-sm font-semibold">
                                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            {hasActiveConversation(lead.phone) && (
                              <div 
                                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-success flex items-center justify-center border-2 border-background"
                                title="Conversa ativa no WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 text-success-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{lead.name}</p>
                              {hasActiveConversation(lead.phone) && (
                                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                                  WhatsApp
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{lead.source}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {lead.phone && (
                            <>
                              <StartConversationButton 
                                phone={lead.phone}
                                name={lead.name}
                                onConversationStarted={handleConversationStarted}
                              />
                              <a 
                                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            </>
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
                        <Badge variant="secondary" className="text-xs">
                          {product?.shortName}
                        </Badge>
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
                        <span className="font-medium text-accent">
                          R$ {lead.value.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewingLead(lead)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingLead(lead)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleConvertToClient(lead)}
                                className="text-success"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Converter em Cliente
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteLead(lead.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {leads.length === 0 
                      ? "Nenhum lead cadastrado. Adicione seu primeiro lead!"
                      : "Nenhum lead encontrado com os filtros aplicados"
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <LeadForm 
              onSubmit={handleEditLead}
              onClose={() => setEditingLead(null)}
              initialData={editingLead}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingLead} onOpenChange={(open) => !open && setViewingLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {viewingLead && (
            <LeadDetailDialog 
              lead={viewingLead} 
              onAddInteraction={addInteraction}
              onUpdateLead={async (leadId, data) => {
                await updateLead(leadId, data);
                // Refresh the viewing lead with updated data
                const updatedLead = leads.find(l => l.id === leadId);
                if (updatedLead) {
                  setViewingLead({ ...updatedLead, ...data } as Lead);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                `Excluir ${selectedLeads.size} lead${selectedLeads.size > 1 ? 's' : ''}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
