import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  MessageCircle,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Play,
  Pause,
  Users,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Tag,
  Package,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCampaigns, Campaign, CampaignFilter, CampaignWithStats } from "@/hooks/useCampaigns";
import { useLeadTags } from "@/hooks/useLeadTags";
import { PRODUCTS, STATUSES } from "@/types/crm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig = {
  rascunho: { label: "Rascunho", color: "bg-secondary text-secondary-foreground", icon: Clock },
  agendada: { label: "Agendada", color: "bg-info/20 text-info", icon: Clock },
  em_andamento: { label: "Em Andamento", color: "bg-warning/20 text-warning", icon: Play },
  pausada: { label: "Pausada", color: "bg-muted text-muted-foreground", icon: Pause },
  concluida: { label: "Concluída", color: "bg-success/20 text-success", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

function CampaignForm({
  type,
  onSubmit,
  onClose,
}: {
  type: 'email' | 'whatsapp';
  onSubmit: (data: {
    name: string;
    description: string;
    subject?: string;
    content: string;
    filters: { filter_type: 'all' | 'tag' | 'product' | 'status' | 'source'; filter_value: string | null }[];
  }) => void;
  onClose: () => void;
}) {
  const { allTags } = useLeadTags();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    content: '',
  });
  const [filterType, setFilterType] = useState<'all' | 'tag' | 'product' | 'status'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.content) {
      toast.error("Preencha nome e conteúdo da campanha");
      return;
    }
    if (type === 'email' && !formData.subject) {
      toast.error("Preencha o assunto do email");
      return;
    }

    const filters: { filter_type: 'all' | 'tag' | 'product' | 'status' | 'source'; filter_value: string | null }[] = [];
    
    if (filterType === 'all') {
      filters.push({ filter_type: 'all', filter_value: null });
    } else if (filterType === 'tag') {
      selectedTags.forEach(tag => filters.push({ filter_type: 'tag', filter_value: tag }));
    } else if (filterType === 'product') {
      selectedProducts.forEach(p => filters.push({ filter_type: 'product', filter_value: p }));
    } else if (filterType === 'status') {
      selectedStatuses.forEach(s => filters.push({ filter_type: 'status', filter_value: s }));
    }

    if (filters.length === 0) {
      filters.push({ filter_type: 'all', filter_value: null });
    }

    onSubmit({
      ...formData,
      filters,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da Campanha *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Promoção de Janeiro"
        />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição opcional da campanha"
        />
      </div>

      {type === 'email' && (
        <div className="space-y-2">
          <Label>Assunto do Email *</Label>
          <Input
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Assunto do email"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>{type === 'email' ? 'Corpo do Email *' : 'Mensagem do WhatsApp *'}</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder={type === 'email' 
            ? "Escreva o conteúdo do email aqui..." 
            : "Escreva a mensagem do WhatsApp aqui..."}
          rows={6}
        />
        <p className="text-xs text-muted-foreground">
          Use {"{nome}"} para inserir o nome do destinatário
        </p>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtrar Destinatários
        </Label>
        
        <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o filtro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Todos os leads
              </span>
            </SelectItem>
            <SelectItem value="tag">
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Por Tag
              </span>
            </SelectItem>
            <SelectItem value="product">
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Por Produto
              </span>
            </SelectItem>
            <SelectItem value="status">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Por Status
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {filterType === 'tag' && (
          <div className="space-y-2">
            <Label className="text-sm">Selecione as tags:</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
              {allTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tag encontrada</p>
              ) : (
                allTags.map(tag => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTags([...selectedTags, tag]);
                        } else {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        }
                      }}
                    />
                    <span className="text-sm">{tag}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        {filterType === 'product' && (
          <div className="space-y-2">
            <Label className="text-sm">Selecione os produtos:</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
              {PRODUCTS.map(product => (
                <label key={product.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts([...selectedProducts, product.id]);
                      } else {
                        setSelectedProducts(selectedProducts.filter(p => p !== product.id));
                      }
                    }}
                  />
                  <span className="text-sm">{product.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {filterType === 'status' && (
          <div className="space-y-2">
            <Label className="text-sm">Selecione os status:</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
              {STATUSES.map(status => (
                <label key={status.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedStatuses.includes(status.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStatuses([...selectedStatuses, status.id]);
                      } else {
                        setSelectedStatuses(selectedStatuses.filter(s => s !== status.id));
                      }
                    }}
                  />
                  <span className="text-sm">{status.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Criar Campanha
        </Button>
      </div>
    </form>
  );
}

function CampaignCard({
  campaign,
  type,
  onView,
  onDelete,
}: {
  campaign: CampaignWithStats;
  type: 'email' | 'whatsapp';
  onView: () => void;
  onDelete: () => void;
}) {
  const config = statusConfig[campaign.status];
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {type === 'email' ? (
                <Mail className="w-4 h-4 text-primary" />
              ) : (
                <MessageCircle className="w-4 h-4 text-success" />
              )}
              {campaign.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {campaign.description || 'Sem descrição'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("gap-1", config.color)}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{campaign.total_recipients}</p>
            <p className="text-xs text-muted-foreground">Destinatários</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{campaign.sent_count}</p>
            <p className="text-xs text-muted-foreground">Enviados</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{campaign.failed_count}</p>
            <p className="text-xs text-muted-foreground">Falhas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-info">{campaign.opened_count}</p>
            <p className="text-xs text-muted-foreground">Abertos</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-right">
          Criada em {format(new Date(campaign.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  );
}

function CampaignList({
  type,
}: {
  type: 'email' | 'whatsapp';
}) {
  const { campaigns, loading, createCampaign, deleteCampaign, getCampaignFilters, populateRecipients } = useCampaigns(type);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (data: {
    name: string;
    description: string;
    subject?: string;
    content: string;
    filters: { filter_type: string; filter_value: string | null }[];
  }) => {
    const campaign = await createCampaign(
      {
        name: data.name,
        description: data.description || null,
        campaign_type: type,
        status: 'rascunho',
        subject: data.subject || null,
        content: data.content,
        scheduled_at: null,
      },
      data.filters
    );

    if (campaign) {
      // Populate recipients based on filters
      const filters = await getCampaignFilters(campaign.id);
      await populateRecipients(campaign.id, filters);
      setIsCreateOpen(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCampaign(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {type === 'email' ? (
                  <Mail className="w-5 h-5" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
                Nova Campanha de {type === 'email' ? 'Email' : 'WhatsApp'}
              </DialogTitle>
              <DialogDescription>
                Crie uma campanha para enviar {type === 'email' ? 'emails' : 'mensagens'} para seus leads
              </DialogDescription>
            </DialogHeader>
            <CampaignForm
              type={type}
              onSubmit={handleCreate}
              onClose={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-secondary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Send className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campaigns.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-warning/10">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'rascunho').length}
                </p>
                <p className="text-xs text-muted-foreground">Rascunhos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-info/10">
                <Play className="w-4 h-4 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'em_andamento').length}
                </p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'concluida').length}
                </p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            {type === 'email' ? (
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            ) : (
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            )}
            <h3 className="font-semibold text-lg mb-2">
              {searchTerm ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha ainda'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? 'Tente buscar com outros termos'
                : `Crie sua primeira campanha de ${type === 'email' ? 'email' : 'WhatsApp'}`}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Campanha
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              type={type}
              onView={() => toast.info("Visualização detalhada em breve")}
              onDelete={() => setDeleteId(campaign.id)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A campanha e todos os seus dados serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campanhas</h1>
        <p className="text-muted-foreground">
          Gerencie suas campanhas de email e WhatsApp
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <CampaignList type="email" />
        </TabsContent>

        <TabsContent value="whatsapp">
          <CampaignList type="whatsapp" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
