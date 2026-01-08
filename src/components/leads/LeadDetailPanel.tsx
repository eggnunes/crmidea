import { useState, useEffect } from "react";
import { Lead, Interaction, PRODUCTS, STATUSES, ProductType, LeadStatus } from "@/types/crm";
import { useLeadProducts } from "@/hooks/useLeadProducts";
import { useLeadTags } from "@/hooks/useLeadTags";
import { 
  Plus, 
  Package, 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Trash2, 
  Loader2,
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  Users,
  Tag,
  Clock,
  FileText,
  X,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LeadAssignees } from "@/components/LeadAssignees";

interface LeadDetailPanelProps {
  lead: Lead;
  onAddInteraction: (leadId: string, interaction: Omit<Interaction, 'id'>) => void;
  onUpdateLead: (leadId: string, data: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>>) => Promise<void>;
}

export function LeadDetailPanel({ lead, onAddInteraction, onUpdateLead }: LeadDetailPanelProps) {
  const [newInteraction, setNewInteraction] = useState({
    type: 'whatsapp' as Interaction['type'],
    description: ''
  });
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(lead.status);
  const [statusReason, setStatusReason] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(lead.notes || '');
  const [newTag, setNewTag] = useState('');
  
  // Products state
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductData, setNewProductData] = useState({
    product: '' as ProductType,
    status: 'novo' as LeadStatus,
    value: 0
  });
  const [showProducts, setShowProducts] = useState(true);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductStatus, setEditingProductStatus] = useState<LeadStatus>('novo');

  // Hooks
  const { leadProducts, loading: loadingProducts, addLeadProduct, updateLeadProduct, deleteLeadProduct } = useLeadProducts(lead.id);
  const { tags, loading: loadingTags, addTag, removeTag } = useLeadTags(lead.id);

  const product = PRODUCTS.find(p => p.id === lead.product);
  const status = STATUSES.find(s => s.id === lead.status);

  useEffect(() => {
    setEditedNotes(lead.notes || '');
    setSelectedStatus(lead.status);
  }, [lead]);

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

  const handleSaveNotes = async () => {
    try {
      await onUpdateLead(lead.id, { notes: editedNotes });
      setIsEditingNotes(false);
      toast.success('Observações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar observações');
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    await addTag(lead.id, newTag);
    setNewTag('');
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

  const interactionIcons: Record<string, React.ReactNode> = {
    whatsapp: <MessageCircle className="w-4 h-4 text-green-500" />,
    email: <Mail className="w-4 h-4 text-blue-500" />,
    ligacao: <Phone className="w-4 h-4 text-orange-500" />,
    reuniao: <Calendar className="w-4 h-4 text-purple-500" />,
    outro: <FileText className="w-4 h-4 text-gray-500" />,
  };

  return (
    <ScrollArea className="h-[75vh] pr-4">
      <div className="space-y-6">
        {/* Header com info básica */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground">
              <span className="text-xl font-bold">
                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{lead.name}</h3>
              <p className="text-muted-foreground text-sm">{lead.email}</p>
              {lead.phone && (
                <p className="text-muted-foreground text-sm">{lead.phone}</p>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {loadingTags ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {tags.map(t => (
                    <Badge 
                      key={t.id} 
                      variant="secondary" 
                      className="flex items-center gap-1 text-xs"
                    >
                      {t.tag}
                      <button
                        onClick={() => removeTag(lead.id, t.tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Nova tag..."
                      className="h-6 w-24 text-xs"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={handleAddTag}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground text-xs">Origem</span>
              <p className="font-medium">{lead.source || '-'}</p>
            </div>
            <div className="p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground text-xs">Valor</span>
              <p className="font-medium text-accent">R$ {lead.value.toLocaleString('pt-BR')}</p>
            </div>
            <div className="p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground text-xs">Criado em</span>
              <p className="font-medium">
                {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground text-xs">Atualizado em</span>
              <p className="font-medium">
                {new Date(lead.updatedAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Observações</span>
            </div>
            {!isEditingNotes && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(true)}>
                <Edit className="w-3 h-3 mr-1" />
                Editar
              </Button>
            )}
          </div>
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Adicione observações sobre este lead..."
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setIsEditingNotes(false);
                  setEditedNotes(lead.notes || '');
                }}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveNotes}>
                  <Save className="w-3 h-3 mr-1" />
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-secondary/30 text-sm min-h-[60px]">
              {lead.notes || <span className="text-muted-foreground italic">Nenhuma observação</span>}
            </div>
          )}
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

        {/* Lead Assignees */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Responsáveis</span>
          </div>
          <LeadAssignees leadId={lead.id} />
        </div>

        {/* Timeline de Interações */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-semibold">Timeline de Interações</h4>
          </div>
          
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
              onKeyDown={(e) => e.key === 'Enter' && handleAddInteraction()}
            />
            <Button onClick={handleAddInteraction} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Timeline Visual */}
          <div className="relative">
            {/* Timeline line */}
            {lead.interactions.length > 0 && (
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            )}
            
            {/* Interaction items */}
            <div className="space-y-4">
              {lead.interactions.length > 0 ? (
                [...lead.interactions].reverse().map((interaction, index) => (
                  <div key={interaction.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-background border-2 border-border flex items-center justify-center">
                      {interactionIcons[interaction.type]}
                    </div>
                    
                    {/* Content */}
                    <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 hover:border-border transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {interaction.type}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {new Date(interaction.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{interaction.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma interação registrada</p>
                  <p className="text-xs">Adicione a primeira interação acima</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
