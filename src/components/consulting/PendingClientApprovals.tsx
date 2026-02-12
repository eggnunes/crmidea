import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserCheck,
  UserX,
  Clock,
  Mail,
  Loader2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingClient {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  office_name: string | null;
  is_approved: boolean;
  created_at: string;
}

export function PendingClientApprovals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingClients, setPendingClients] = useState<PendingClient[]>([]);
  const [approvedClients, setApprovedClients] = useState<PendingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingClient | null>(null);
  const [deleting, setDeleting] = useState<PendingClient | null>(null);
  const [editing, setEditing] = useState<PendingClient | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', office_name: '' });

  const fetchClients = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('consultant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const pending = (data || []).filter(c => !c.is_approved);
      const approved = (data || []).filter(c => c.is_approved);
      
      setPendingClients(pending);
      setApprovedClients(approved);
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

  const approveClient = async (client: PendingClient) => {
    setApproving(client.id);
    try {
      // Determine consulting status based on diagnostic completion
      let desiredConsultingStatus: 'pending' | 'in_progress' = 'pending';
      try {
        const { data: progress } = await supabase
          .from('diagnostic_form_progress')
          .select('is_completed')
          .eq('client_user_id', client.user_id)
          .maybeSingle();
        if (progress?.is_completed) desiredConsultingStatus = 'in_progress';
      } catch (e) {
        // Non-blocking
        console.warn('Could not fetch diagnostic progress to set status:', e);
      }

      // 1. Update client_profiles to mark as approved
      const { error: updateError } = await supabase
        .from('client_profiles')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', client.id);

      if (updateError) throw updateError;

      // 2. Ensure an entry exists in consulting_clients (1 per consultant+email)
      // IMPORTANT: do not overwrite richer data with placeholders.
      const { error: insertError } = await supabase
        .from('consulting_clients')
        .insert({
          user_id: user?.id,
          lead_id: null,
          full_name: client.full_name,
          email: client.email,
          phone: client.phone || '',
          office_name: client.office_name || 'Não informado',
          office_address: 'A preencher',
          num_lawyers: 1,
          num_employees: 1,
          status: desiredConsultingStatus,
        });

      if (insertError) {
        const code = (insertError as any)?.code;
        // 23505 = unique_violation (already exists) -> ok
        if (code === '23505') {
          // If the record already exists, update status to keep it consistent with diagnostic completion
          const { data: existingClient } = await supabase
            .from('consulting_clients')
            .select('id, status')
            .eq('user_id', user?.id)
            .eq('email', client.email)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingClient?.id && existingClient.status !== desiredConsultingStatus) {
            await supabase
              .from('consulting_clients')
              .update({ status: desiredConsultingStatus, updated_at: new Date().toISOString() })
              .eq('id', existingClient.id);
          }
        } else {
          console.error('Error creating consulting_client:', insertError);
        }
      }

      // 3. Create timeline event
      await supabase
        .from('client_timeline_events')
        .insert({
          client_user_id: client.user_id,
          consultant_id: user?.id,
          event_type: "approval",
          title: "Cadastro aprovado",
          description: "Seu acesso à área do cliente foi liberado!",
        });

      // 4. Send notification to client (email + WhatsApp)
      const dashboardUrl = `${window.location.origin}/consultoria/dashboard`;
      try {
        await supabase.functions.invoke("notify-client-approved", {
          body: {
            clientName: client.full_name,
            clientEmail: client.email,
            clientPhone: client.phone,
            dashboardUrl: dashboardUrl,
          },
        });
      } catch (notifyError) {
        console.error('Error sending approval notification:', notifyError);
      }

      // 5. Send welcome email with diagnostic form link
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            clientName: client.full_name,
            clientEmail: client.email,
            officeName: client.office_name || 'Seu Escritório',
            consultantId: user?.id,
            clientId: client.user_id,
            checkFormFilled: true,
          },
        });
      } catch (welcomeError) {
        console.error('Error sending welcome email:', welcomeError);
      }

      toast.success(`${client.full_name} aprovado com sucesso!`);
      fetchClients();
    } catch (error) {
      console.error('Error approving client:', error);
      toast.error('Erro ao aprovar cliente');
    } finally {
      setApproving(null);
    }
  };

  const rejectClient = async () => {
    if (!rejecting) return;
    
    try {
      // Call edge function to properly delete including auth user
      const { data, error } = await supabase.functions.invoke("cleanup-orphaned-user", {
        body: {
          userId: rejecting.user_id,
          email: rejecting.email,
        },
      });

      if (error) {
        console.error("Error calling cleanup function:", error);
        // Fallback to direct deletion
        await supabase
          .from('client_profiles')
          .delete()
          .eq('id', rejecting.id);

        await supabase
          .from('diagnostic_form_progress')
          .delete()
          .eq('client_user_id', rejecting.user_id);

        await supabase
          .from('client_timeline_events')
          .delete()
          .eq('client_user_id', rejecting.user_id);
      }

      toast.success('Cadastro rejeitado e removido');
      setRejecting(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error rejecting client:', error);
      toast.error('Erro ao rejeitar cadastro');
    }
  };

  const deleteApprovedClient = async () => {
    if (!deleting) return;
    
    try {
      // Call edge function to properly delete including auth user
      const { data, error } = await supabase.functions.invoke("cleanup-orphaned-user", {
        body: {
          userId: deleting.user_id,
          email: deleting.email,
        },
      });

      if (error) {
        console.error("Error calling cleanup function:", error);
        // Fallback to direct deletion
        await supabase
          .from('client_profiles')
          .delete()
          .eq('id', deleting.id);

        await supabase
          .from('consulting_clients')
          .delete()
          .eq('email', deleting.email)
          .eq('user_id', user?.id);

        await supabase
          .from('diagnostic_form_progress')
          .delete()
          .eq('client_user_id', deleting.user_id);

        await supabase
          .from('client_timeline_events')
          .delete()
          .eq('client_user_id', deleting.user_id);
      }

      toast.success('Cliente excluído com sucesso');
      setDeleting(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const openEditDialog = (client: PendingClient) => {
    setEditForm({
      full_name: client.full_name,
      email: client.email,
      phone: client.phone || '',
      office_name: client.office_name || '',
    });
    setEditing(client);
  };

  const saveEdit = async () => {
    if (!editing) return;
    
    try {
      // Update client_profiles
      const { error: profileError } = await supabase
        .from('client_profiles')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone,
          office_name: editForm.office_name,
        })
        .eq('id', editing.id);

      if (profileError) throw profileError;

      // Update consulting_clients (pick latest record for that email)
      const { data: existing, error: existingError } = await supabase
        .from('consulting_clients')
        .select('id')
        .eq('user_id', user?.id)
        .eq('email', editing.email)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing?.id) {
        const { error: updateClientError } = await supabase
          .from('consulting_clients')
          .update({
            full_name: editForm.full_name,
            email: editForm.email,
            phone: editForm.phone,
            office_name: editForm.office_name || 'Não informado',
          })
          .eq('id', existing.id);
        if (updateClientError) throw updateClientError;
      }

      toast.success('Cliente atualizado com sucesso');
      setEditing(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente');
    }
  };

  const viewClientDashboard = async (client: PendingClient) => {
    // Find consulting_client by email (user_id in consulting_clients is the consultant's ID)
    const { data, error } = await supabase
      .from('consulting_clients')
      .select('id')
      .eq('email', client.email)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error finding client:', error);
      toast.error('Erro ao buscar cliente');
      return;
    }

    if (data) {
      navigate(`/metodo-idea/consultoria/cliente/${data.id}`);
    } else {
      // Try to create the consulting_client entry if it doesn't exist
      const { data: newClient, error: insertError } = await supabase
        .from('consulting_clients')
        .insert({
          user_id: user?.id,
          full_name: client.full_name,
          email: client.email,
          phone: client.phone || '',
          office_name: client.office_name || 'Não informado',
          office_address: 'A preencher',
          num_lawyers: 1,
          num_employees: 1,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) {
        const code = (insertError as any)?.code;
        if (code !== '23505') {
          console.error('Error creating consulting_client:', insertError);
          toast.error('Erro ao criar registro do cliente');
          return;
        }

        // If it already exists (unique), fetch and navigate
        const { data: existing, error: existingError } = await supabase
          .from('consulting_clients')
          .select('id')
          .eq('email', client.email)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingError || !existing?.id) {
          toast.error('Erro ao buscar registro do cliente');
          return;
        }

        navigate(`/metodo-idea/consultoria/cliente/${existing.id}`);
        return;
      }

      if (newClient) {
        navigate(`/metodo-idea/consultoria/cliente/${newClient.id}`);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <Card className={pendingClients.length > 0 ? "border-amber-500/50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Cadastros Pendentes de Aprovação
            {pendingClients.length > 0 && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
                {pendingClients.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Aprove ou rejeite novos cadastros de clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p>Nenhum cadastro pendente</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="font-medium">{client.full_name}</div>
                        {client.office_name && (
                          <div className="text-xs text-muted-foreground">
                            {client.office_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(client.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveClient(client)}
                            disabled={approving === client.id}
                          >
                            {approving === client.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-1" />
                                Aprovar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setRejecting(client)}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Approved Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-500" />
            Clientes Aprovados
            <Badge variant="secondary" className="bg-green-500/20 text-green-600">
              {approvedClients.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Clientes com acesso liberado à área do cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvedClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente aprovado ainda</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="font-medium">{client.full_name}</div>
                        {client.office_name && (
                          <div className="text-xs text-muted-foreground">
                            {client.office_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">
                          Aprovado
                        </Badge>
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => viewClientDashboard(client)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(client)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleting(client)}
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

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={!!rejecting} onOpenChange={() => setRejecting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Cadastro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rejeitar o cadastro de <strong>{rejecting?.full_name}</strong>?
              <br /><br />
              Esta ação removerá o cadastro do sistema e o usuário não terá acesso à área do cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={rejectClient}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{deleting?.full_name}</strong>?
              <br /><br />
              Esta ação removerá todos os dados do cliente do sistema e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteApprovedClient}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="office_name">Escritório</Label>
              <Input
                id="office_name"
                value={editForm.office_name}
                onChange={(e) => setEditForm({ ...editForm, office_name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
