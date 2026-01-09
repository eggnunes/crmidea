import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  MoreHorizontal,
  Building2,
  Mail,
  Phone,
  Loader2,
  Eye,
  ExternalLink,
  Calendar,
  FileText,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface ConsultingClient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  office_name: string;
  cidade: string | null;
  estado: string | null;
  num_lawyers: number;
  num_employees: number;
  status: string;
  created_at: string;
  practice_areas: string | null;
}

const statusOptions = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-700' },
];

export function ConsultingClientsAdmin() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ConsultingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Edit dialog
  const [editingClient, setEditingClient] = useState<ConsultingClient | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    office_name: "",
    practice_areas: "",
    status: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deletingClient, setDeletingClient] = useState<ConsultingClient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consulting_clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user?.id]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.office_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const openEditDialog = (client: ConsultingClient) => {
    setEditingClient(client);
    setEditFormData({
      full_name: client.full_name,
      email: client.email,
      phone: client.phone,
      office_name: client.office_name,
      practice_areas: client.practice_areas || "",
      status: client.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingClient) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('consulting_clients')
        .update({
          full_name: editFormData.full_name,
          email: editFormData.email,
          phone: editFormData.phone,
          office_name: editFormData.office_name,
          practice_areas: editFormData.practice_areas || null,
          status: editFormData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingClient.id);

      if (error) throw error;
      
      toast.success('Cliente atualizado com sucesso!');
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    
    setDeleting(true);
    try {
      // Delete related records first
      await supabase.from('consulting_sessions').delete().eq('client_id', deletingClient.id);
      await supabase.from('consulting_client_reminders').delete().eq('client_id', deletingClient.id);
      await supabase.from('client_progress_feedback').delete().eq('client_id', deletingClient.id);
      await supabase.from('client_earned_badges').delete().eq('client_id', deletingClient.id);
      
      // Delete the client
      const { error } = await supabase
        .from('consulting_clients')
        .delete()
        .eq('id', deletingClient.id);

      if (error) throw error;
      
      toast.success('Cliente excluído com sucesso!');
      setDeletingClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente');
    } finally {
      setDeleting(false);
    }
  };

  const markAsCompleted = async (client: ConsultingClient) => {
    try {
      const { error } = await supabase
        .from('consulting_clients')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', client.id);

      if (error) throw error;
      
      toast.success('Consultoria marcada como concluída!');
      fetchClients();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const updateStatus = async (client: ConsultingClient, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consulting_clients')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', client.id);

      if (error) throw error;
      
      const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
      toast.success(`Status atualizado para: ${statusLabel}`);
      fetchClients();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find(s => s.value === status) || statusOptions[0];
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const stats = {
    total: clients.length,
    pending: clients.filter(c => c.status === 'pending').length,
    inProgress: clients.filter(c => c.status === 'in_progress').length,
    completed: clients.filter(c => c.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Administração de Clientes
          </CardTitle>
          <CardDescription>
            Gerencie todos os clientes de consultoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente encontrado</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Escritório</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link 
                          to={`/metodo-idea/consultoria/cliente/${client.id}`}
                          className="font-medium text-primary hover:underline cursor-pointer"
                        >
                          {client.full_name}
                        </Link>
                        {client.practice_areas && (
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {client.practice_areas}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{client.office_name}</span>
                        </div>
                        {(client.cidade || client.estado) && (
                          <div className="text-xs text-muted-foreground">
                            {client.cidade}{client.cidade && client.estado ? ' - ' : ''}{client.estado}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/metodo-idea/consultoria/cliente/${client.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Dashboard
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(client)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {client.status === 'pending' && (
                              <DropdownMenuItem onClick={() => updateStatus(client, 'in_progress')}>
                                <Calendar className="w-4 h-4 mr-2" />
                                Iniciar Consultoria
                              </DropdownMenuItem>
                            )}
                            {client.status !== 'completed' && (
                              <DropdownMenuItem onClick={() => markAsCompleted(client)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Marcar como Concluído
                              </DropdownMenuItem>
                            )}
                            {client.status === 'completed' && (
                              <DropdownMenuItem onClick={() => updateStatus(client, 'in_progress')}>
                                <Calendar className="w-4 h-4 mr-2" />
                                Reabrir Consultoria
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeletingClient(client)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Nome Completo</Label>
              <Input
                id="edit_full_name"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">E-mail</Label>
              <Input
                id="edit_email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Telefone</Label>
              <Input
                id="edit_phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_office_name">Nome do Escritório</Label>
              <Input
                id="edit_office_name"
                value={editFormData.office_name}
                onChange={(e) => setEditFormData({ ...editFormData, office_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_practice_areas">Áreas de Atuação</Label>
              <Textarea
                id="edit_practice_areas"
                value={editFormData.practice_areas}
                onChange={(e) => setEditFormData({ ...editFormData, practice_areas: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status">Status</Label>
              <Select 
                value={editFormData.status} 
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{deletingClient?.full_name}"? 
              Esta ação não pode ser desfeita e todos os dados relacionados serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
