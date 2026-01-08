import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  UserCheck,
  UserX,
  Clock,
  Mail,
  Loader2,
  CheckCircle,
  XCircle,
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
  const [pendingClients, setPendingClients] = useState<PendingClient[]>([]);
  const [approvedClients, setApprovedClients] = useState<PendingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingClient | null>(null);

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

      // 2. Create entry in consulting_clients so client appears in "Clientes" tab
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
          status: 'pending',
        });

      if (insertError) {
        console.error('Error creating consulting_client:', insertError);
        // Don't fail the whole operation if this fails
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
      // Delete client profile
      await supabase
        .from('client_profiles')
        .delete()
        .eq('id', rejecting.id);

      // Delete form progress
      await supabase
        .from('diagnostic_form_progress')
        .delete()
        .eq('client_user_id', rejecting.user_id);

      // Delete timeline events
      await supabase
        .from('client_timeline_events')
        .delete()
        .eq('client_user_id', rejecting.user_id);

      toast.success('Cadastro rejeitado');
      setRejecting(null);
      fetchClients();
    } catch (error) {
      console.error('Error rejecting client:', error);
      toast.error('Erro ao rejeitar cadastro');
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
    </div>
  );
}
