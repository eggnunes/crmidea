import { useState } from "react";
import { useClients, Client, ClientInsert } from "@/hooks/useClients";
import { PRODUCTS } from "@/types/crm";
import { 
  Plus, 
  Search, 
  Loader2,
  Users,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientDetailDialog } from "@/components/clients/ClientDetailDialog";

const STATUS_CONFIG = {
  ativo: { label: "Ativo", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  pausado: { label: "Pausado", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  concluido: { label: "Concluído", color: "bg-info/10 text-info border-info/20", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

const PAYMENT_STATUS = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning" },
  pago: { label: "Pago", color: "bg-success/10 text-success" },
  parcial: { label: "Parcial", color: "bg-info/10 text-info" },
};

const AI_LEVELS = [
  { id: "iniciante", name: "Iniciante" },
  { id: "intermediario", name: "Intermediário" },
  { id: "avancado", name: "Avançado" },
];

function ClientForm({ 
  onSubmit, 
  onClose,
  initialData 
}: { 
  onSubmit: (data: ClientInsert) => void;
  onClose: () => void;
  initialData?: Client;
}) {
  const [formData, setFormData] = useState<ClientInsert>({
    lead_id: initialData?.lead_id || null,
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    area_atuacao: initialData?.area_atuacao || '',
    oab_number: initialData?.oab_number || '',
    escritorio: initialData?.escritorio || '',
    cidade: initialData?.cidade || '',
    estado: initialData?.estado || '',
    product_type: initialData?.product_type || 'consultoria',
    contract_start_date: initialData?.contract_start_date || new Date().toISOString().split('T')[0],
    contract_end_date: initialData?.contract_end_date || null,
    contract_value: initialData?.contract_value || 0,
    payment_status: initialData?.payment_status || 'pendente',
    objectives: initialData?.objectives || '',
    challenges: initialData?.challenges || '',
    ai_knowledge_level: initialData?.ai_knowledge_level || 'iniciante',
    form_data: initialData?.form_data || {},
    status: initialData?.status || 'ativo',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.product_type) {
      return;
    }
    onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Dados Básicos */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Dados Básicos</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </div>

      {/* Dados Profissionais */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Dados Profissionais</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="area_atuacao">Área de Atuação</Label>
            <Input
              id="area_atuacao"
              value={formData.area_atuacao || ''}
              onChange={(e) => setFormData({ ...formData, area_atuacao: e.target.value })}
              placeholder="Direito Civil, Trabalhista..."
            />
          </div>
          <div>
            <Label htmlFor="oab_number">Número OAB</Label>
            <Input
              id="oab_number"
              value={formData.oab_number || ''}
              onChange={(e) => setFormData({ ...formData, oab_number: e.target.value })}
              placeholder="123456/SP"
            />
          </div>
          <div>
            <Label htmlFor="escritorio">Escritório</Label>
            <Input
              id="escritorio"
              value={formData.escritorio || ''}
              onChange={(e) => setFormData({ ...formData, escritorio: e.target.value })}
              placeholder="Nome do escritório"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade || ''}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado || ''}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dados do Contrato */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Contrato</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product_type">Produto/Serviço *</Label>
            <Select
              value={formData.product_type}
              onValueChange={(value) => setFormData({ ...formData, product_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
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
            <Label htmlFor="contract_value">Valor (R$)</Label>
            <Input
              id="contract_value"
              type="number"
              value={formData.contract_value}
              onChange={(e) => setFormData({ ...formData, contract_value: Number(e.target.value) })}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="contract_start_date">Data Início</Label>
            <Input
              id="contract_start_date"
              type="date"
              value={formData.contract_start_date}
              onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contract_end_date">Data Fim (opcional)</Label>
            <Input
              id="contract_end_date"
              type="date"
              value={formData.contract_end_date || ''}
              onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value || null })}
            />
          </div>
          <div>
            <Label htmlFor="payment_status">Status Pagamento</Label>
            <Select
              value={formData.payment_status}
              onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status do Cliente</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Perfil */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Perfil do Cliente</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="ai_knowledge_level">Nível de Conhecimento em IA</Label>
            <Select
              value={formData.ai_knowledge_level}
              onValueChange={(value) => setFormData({ ...formData, ai_knowledge_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_LEVELS.map(level => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="objectives">Objetivos</Label>
            <Textarea
              id="objectives"
              value={formData.objectives || ''}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              placeholder="Quais são os objetivos do cliente com a mentoria/consultoria?"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="challenges">Desafios</Label>
            <Textarea
              id="challenges"
              value={formData.challenges || ''}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              placeholder="Quais são os principais desafios e dores do cliente?"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background py-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Salvar' : 'Cadastrar Cliente'}
        </Button>
      </div>
    </form>
  );
}

export function ClientsPage() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesProduct = filterProduct === 'all' || client.product_type === filterProduct;
    return matchesSearch && matchesStatus && matchesProduct;
  });

  const handleAddClient = async (data: ClientInsert) => {
    await addClient(data);
    setIsAddDialogOpen(false);
  };

  const handleEditClient = async (data: ClientInsert) => {
    if (editingClient) {
      await updateClient(editingClient.id, data);
      setEditingClient(null);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteClient(id);
    }
  };

  // Stats
  const activeClients = clients.filter(c => c.status === 'ativo').length;
  const totalValue = clients.reduce((sum, c) => sum + (c.contract_value || 0), 0);
  const paidValue = clients.filter(c => c.payment_status === 'pago').reduce((sum, c) => sum + (c.contract_value || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gestão de clientes e prontuários</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <ClientForm 
              onSubmit={handleAddClient} 
              onClose={() => setIsAddDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-xs text-muted-foreground">Total de Clientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeClients}</p>
              <p className="text-xs text-muted-foreground">Clientes Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <DollarSign className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ {totalValue.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Valor Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ {paidValue.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Valor Recebido</p>
            </div>
          </CardContent>
        </Card>
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
                placeholder="Buscar por nome ou email..."
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Produtos</SelectItem>
                {PRODUCTS.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card className="glass border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contato</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Produto</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pagamento</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map(client => {
                  const product = PRODUCTS.find(p => p.id === client.product_type);
                  const statusConfig = STATUS_CONFIG[client.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ativo;
                  const paymentConfig = PAYMENT_STATUS[client.payment_status as keyof typeof PAYMENT_STATUS] || PAYMENT_STATUS.pendente;

                  return (
                    <tr key={client.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-sm font-semibold text-foreground">
                              {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Desde {format(new Date(client.contract_start_date), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {client.phone && (
                            <a 
                              href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {client.email && (
                            <a 
                              href={`mailto:${client.email}`}
                              className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="text-xs">
                          {product?.shortName || client.product_type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className={cn("text-xs", paymentConfig.color)}>
                          {paymentConfig.label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-accent">
                          R$ {client.contract_value.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewingClient(client)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingClient(client)}
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
                                onClick={() => handleDeleteClient(client.id)}
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
                    {clients.length === 0 
                      ? "Nenhum cliente cadastrado. Adicione seu primeiro cliente!"
                      : "Nenhum cliente encontrado com os filtros aplicados"
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <ClientForm 
              onSubmit={handleEditClient} 
              onClose={() => setEditingClient(null)}
              initialData={editingClient}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog (Prontuário) */}
      {viewingClient && (
        <ClientDetailDialog
          client={viewingClient}
          open={!!viewingClient}
          onOpenChange={(open) => !open && setViewingClient(null)}
        />
      )}
    </div>
  );
}
