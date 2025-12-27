import { useState, useMemo } from "react";
import { STATUSES, Lead, LeadStatus, PRODUCTS, Interaction } from "@/types/crm";
import { useLeads } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Phone, Mail, Filter, ShoppingCart, RefreshCcw, XCircle, AlertTriangle, CheckCircle, X, LayoutGrid, List, Calendar, DollarSign } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LeadAssignees } from "@/components/LeadAssignees";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Predefined reason types with their display info
const REASON_OPTIONS = [
  { id: 'carrinho_abandonado', label: 'Carrinho abandonado', color: 'bg-warning/20 text-warning border-warning/30', icon: ShoppingCart },
  { id: 'reembolso', label: 'Reembolso', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: RefreshCcw },
  { id: 'pagamento_recusado', label: 'Pagamento recusado', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: XCircle },
  { id: 'chargeback', label: 'Chargeback', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: AlertTriangle },
  { id: 'compra_aprovada', label: 'Compra aprovada', color: 'bg-success/20 text-success border-success/30', icon: CheckCircle },
  { id: 'cancelamento', label: 'Cancelamento', color: 'bg-muted text-muted-foreground border-muted-foreground/30', icon: X },
] as const;

// Helper function to get the reason/motivo for a lead's current status
function getStatusReason(lead: Lead): { id: string; label: string } | null {
  // Check the most recent interaction for context
  if (lead.interactions.length > 0) {
    const latestInteraction = lead.interactions[lead.interactions.length - 1];
    const desc = latestInteraction.description.toLowerCase();
    
    // Map common interaction descriptions to readable reasons
    if (desc.includes('carrinho abandonado') || desc.includes('pix gerado') || desc.includes('boleto gerado')) {
      return { id: 'carrinho_abandonado', label: 'Carrinho abandonado' };
    }
    if (desc.includes('reembolso') || desc.includes('reembolsado')) {
      return { id: 'reembolso', label: 'Reembolso' };
    }
    if (desc.includes('recusad') || desc.includes('recusa')) {
      return { id: 'pagamento_recusado', label: 'Pagamento recusado' };
    }
    if (desc.includes('chargeback')) {
      return { id: 'chargeback', label: 'Chargeback' };
    }
    if (desc.includes('compra aprovada') || desc.includes('pagamento confirmado')) {
      return { id: 'compra_aprovada', label: 'Compra aprovada' };
    }
    if (desc.includes('cancelad')) {
      return { id: 'cancelamento', label: 'Cancelamento' };
    }
    
    // Return a generic "other" reason with the description
    if (latestInteraction.description.length <= 30) {
      return { id: 'outro', label: latestInteraction.description };
    }
  }
  
  // Check notes for reason
  if (lead.notes) {
    const notes = lead.notes.toLowerCase();
    if (notes.includes('carrinho abandonado')) return { id: 'carrinho_abandonado', label: 'Carrinho abandonado' };
    if (notes.includes('reembolso')) return { id: 'reembolso', label: 'Reembolso' };
    if (notes.includes('recusad')) return { id: 'pagamento_recusado', label: 'Pagamento recusado' };
    if (notes.includes('chargeback')) return { id: 'chargeback', label: 'Chargeback' };
  }
  
  return null;
}

// Get reason display info
function getReasonDisplayInfo(reasonId: string) {
  const option = REASON_OPTIONS.find(r => r.id === reasonId);
  if (option) return option;
  return { id: 'outro', label: reasonId, color: 'bg-muted text-muted-foreground border-muted-foreground/30', icon: null };
}

function LeadDetailDialog({ 
  lead, 
  onAddInteraction,
  onClose 
}: { 
  lead: Lead; 
  onAddInteraction: (leadId: string, interaction: Omit<Interaction, 'id'>) => void;
  onClose: () => void;
}) {
  const [newInteraction, setNewInteraction] = useState({
    type: 'whatsapp' as Interaction['type'],
    description: ''
  });

  const product = PRODUCTS.find(p => p.id === lead.product);
  const statusInfo = STATUSES.find(s => s.id === lead.status);
  const reason = getStatusReason(lead);

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

        {/* Status and Reason */}
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">Status:</span>
              <p className="font-medium">{statusInfo?.name}</p>
            </div>
            {reason && (
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Motivo:</span>
                <p className="font-medium text-warning">{reason.label}</p>
              </div>
            )}
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

function LeadCard({ lead, isDragging = false, onClick }: { lead: Lead; isDragging?: boolean; onClick?: () => void }) {
  const product = PRODUCTS.find(p => p.id === lead.product);
  const reason = getStatusReason(lead);
  const reasonDisplay = reason ? getReasonDisplayInfo(reason.id) : null;
  
  const productColors: Record<string, string> = {
    consultoria: "border-l-consultoria",
    mentoria: "border-l-mentoria",
    curso: "border-l-curso",
    ebook: "border-l-ebook"
  };

  return (
    <div 
      className={cn(
        "p-3 bg-secondary border border-border rounded-lg border-l-4 transition-all shadow-sm",
        productColors[product?.color || 'primary'],
        isDragging && "opacity-50 scale-105 shadow-xl",
        onClick && "cursor-pointer hover:bg-secondary/80"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-foreground line-clamp-1">{lead.name}</h4>
        <span className="text-xs font-semibold text-accent whitespace-nowrap">
          R$ {lead.value.toLocaleString('pt-BR')}
        </span>
      </div>
      
      {/* Show reason/motivo prominently */}
      {reason && reasonDisplay && (
        <div className={cn(
          "flex items-center gap-1.5 mb-2 px-2 py-1 rounded-md border text-xs font-medium",
          reasonDisplay.color
        )}>
          {reasonDisplay.icon && <reasonDisplay.icon className="w-3 h-3" />}
          <span>{reason.label}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {product?.shortName}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {lead.interactions.length} interações
        </span>
      </div>
    </div>
  );
}

function SortableLeadCard({ lead, onCardClick }: { lead: Lead; onCardClick: (lead: Lead) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging
    if (!isDragging) {
      onCardClick(lead);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
      onClick={handleClick}
    >
      <LeadCard lead={lead} isDragging={isDragging} />
    </div>
  );
}

function PipelineColumn({ 
  status, 
  leads,
  totalValue,
  onCardClick
}: { 
  status: typeof STATUSES[0]; 
  leads: Lead[];
  totalValue: number;
  onCardClick: (lead: Lead) => void;
}) {
  const statusHeaderColors: Record<string, string> = {
    info: "bg-info/10 border-info/30",
    primary: "bg-primary/10 border-primary/30",
    warning: "bg-warning/10 border-warning/30",
    mentoria: "bg-mentoria/10 border-mentoria/30",
    success: "bg-success/10 border-success/30",
    destructive: "bg-destructive/10 border-destructive/30"
  };

  return (
    <div className="flex-1 min-w-[280px] max-w-[320px]">
      <div className={cn(
        "rounded-t-lg p-3 border border-b-0",
        statusHeaderColors[status.color]
      )}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm">{status.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          R$ {totalValue.toLocaleString('pt-BR')}
        </p>
      </div>
      <div className="bg-background/50 rounded-b-lg border border-t-0 border-border p-2 min-h-[400px] space-y-2">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <SortableLeadCard key={lead.id} lead={lead} onCardClick={onCardClick} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Arraste leads aqui
          </div>
        )}
      </div>
    </div>
  );
}

// List view for sales/abandoned carts
function LeadListView({ 
  leads, 
  title,
  onCardClick 
}: { 
  leads: Lead[];
  title: string;
  onCardClick: (lead: Lead) => void;
}) {
  if (leads.length === 0) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-8 text-center text-muted-foreground">
          Nenhum registro encontrado
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {title}
          <Badge variant="secondary">{leads.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map(lead => {
              const product = PRODUCTS.find(p => p.id === lead.product);
              const reason = getStatusReason(lead);
              const reasonDisplay = reason ? getReasonDisplayInfo(reason.id) : null;
              
              return (
                <TableRow 
                  key={lead.id} 
                  className="cursor-pointer hover:bg-secondary/50"
                  onClick={() => onCardClick(lead)}
                >
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {product?.shortName || lead.product}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-accent font-semibold">
                    R$ {lead.value.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.updatedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    {reasonDisplay && (
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium",
                        reasonDisplay.color
                      )}>
                        {reasonDisplay.icon && <reasonDisplay.icon className="w-3 h-3" />}
                        <span>{reason?.label}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {lead.source || '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function PipelinePage() {
  const { leads, loading, updateLeadStatus, addInteraction } = useLeads();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [filterReason, setFilterReason] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter leads by reason
  const filteredLeads = useMemo(() => {
    if (filterReason === 'all') return leads;
    
    return leads.filter(lead => {
      const reason = getStatusReason(lead);
      if (!reason) return filterReason === 'sem_motivo';
      return reason.id === filterReason;
    });
  }, [leads, filterReason]);

  // Get recent sales (fechado-ganho) sorted by date
  const recentSales = useMemo(() => {
    return leads
      .filter(l => l.status === 'fechado-ganho')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 50);
  }, [leads]);

  // Get abandoned carts
  const abandonedCarts = useMemo(() => {
    return leads
      .filter(l => {
        const reason = getStatusReason(l);
        return reason?.id === 'carrinho_abandonado';
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [leads]);

  // Get count of leads per reason for filter badges
  const reasonCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(lead => {
      const reason = getStatusReason(lead);
      const reasonId = reason?.id || 'sem_motivo';
      counts[reasonId] = (counts[reasonId] || 0) + 1;
    });
    return counts;
  }, [leads]);

  // Group filtered leads by status
  const leadsByStatus = STATUSES.reduce((acc, status) => {
    acc[status.id] = filteredLeads.filter(l => l.status === status.id);
    return acc;
  }, {} as Record<string, Lead[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeLead = leads.find(l => l.id === activeId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a status column
    const targetStatus = STATUSES.find(s => s.id === overId);
    if (targetStatus) {
      await updateLeadStatus(leadId, targetStatus.id);
      return;
    }

    // Check if dropped on another lead - get that lead's status
    const targetLead = leads.find(l => l.id === overId);
    if (targetLead) {
      await updateLeadStatus(leadId, targetLead.status);
    }
  };

  const handleCardClick = (lead: Lead) => {
    setViewingLead(lead);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground mt-1">Visualize e gerencie seu funil de vendas</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="gap-1"
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'lista' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('lista')}
              className="gap-1"
            >
              <List className="w-4 h-4" />
              Lista
            </Button>
          </div>

          {/* Filter by Reason */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterReason} onValueChange={setFilterReason}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todos os motivos ({leads.length})
                </SelectItem>
                {REASON_OPTIONS.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" />
                      <span>{option.label}</span>
                      {reasonCounts[option.id] && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {reasonCounts[option.id]}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="sem_motivo">
                  Sem motivo ({reasonCounts['sem_motivo'] || 0})
                </SelectItem>
              </SelectContent>
            </Select>
            {filterReason !== 'all' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilterReason('all')}
                className="text-muted-foreground"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <>
          {/* Pipeline Board - Kanban View */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STATUSES.map(status => (
                <PipelineColumn
                  key={status.id}
                  status={status}
                  leads={leadsByStatus[status.id] || []}
                  totalValue={
                    (leadsByStatus[status.id] || []).reduce((acc, l) => acc + l.value, 0)
                  }
                  onCardClick={handleCardClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeLead && <LeadCard lead={activeLead} isDragging />}
            </DragOverlay>
          </DndContext>
        </>
      ) : (
        /* List View */
        <Tabs defaultValue="vendas" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="vendas" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Vendas Recentes
              <Badge variant="secondary" className="ml-1">{recentSales.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="abandonados" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Carrinhos Abandonados
              <Badge variant="secondary" className="ml-1">{abandonedCarts.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="vendas">
            <LeadListView 
              leads={recentSales} 
              title="Vendas Recentes (Negócios Fechados)" 
              onCardClick={handleCardClick}
            />
          </TabsContent>
          
          <TabsContent value="abandonados">
            <LeadListView 
              leads={abandonedCarts} 
              title="Carrinhos Abandonados" 
              onCardClick={handleCardClick}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Lead Detail Dialog */}
      <Dialog open={!!viewingLead} onOpenChange={(open) => !open && setViewingLead(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {viewingLead && (
            <LeadDetailDialog 
              lead={viewingLead} 
              onAddInteraction={addInteraction}
              onClose={() => setViewingLead(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Leads Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {leads.filter(l => !l.status.startsWith('fechado')).length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50 border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Fechados (Ganho)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {leadsByStatus['fechado-ganho']?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50 border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Fechados (Perdido)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {leadsByStatus['fechado-perdido']?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}