import { useState } from "react";
import { STATUSES, Lead, LeadStatus, PRODUCTS } from "@/types/crm";
import { useLeads } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
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

function LeadCard({ lead, isDragging = false }: { lead: Lead; isDragging?: boolean }) {
  const product = PRODUCTS.find(p => p.id === lead.product);
  
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
        isDragging && "opacity-50 scale-105 shadow-xl"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-foreground line-clamp-1">{lead.name}</h4>
        <span className="text-xs font-semibold text-accent whitespace-nowrap">
          R$ {lead.value.toLocaleString('pt-BR')}
        </span>
      </div>
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

function SortableLeadCard({ lead }: { lead: Lead }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <LeadCard lead={lead} isDragging={isDragging} />
    </div>
  );
}

function PipelineColumn({ 
  status, 
  leads,
  totalValue
}: { 
  status: typeof STATUSES[0]; 
  leads: Lead[];
  totalValue: number;
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
            <SortableLeadCard key={lead.id} lead={lead} />
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

export function PipelinePage() {
  const { leads, loading, updateLeadStatus } = useLeads();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  // Group leads by status
  const leadsByStatus = STATUSES.reduce((acc, status) => {
    acc[status.id] = leads.filter(l => l.status === status.id);
    return acc;
  }, {} as Record<string, Lead[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pipeline</h1>
        <p className="text-muted-foreground mt-1">Visualize e gerencie seu funil de vendas</p>
      </div>

      {/* Pipeline Board */}
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
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead && <LeadCard lead={activeLead} isDragging />}
        </DragOverlay>
      </DndContext>

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
