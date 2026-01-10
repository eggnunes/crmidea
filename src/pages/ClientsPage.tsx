import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Search, 
  Loader2,
  Users,
  Eye,
  Trash2,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Send,
  ExternalLink
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConsultingClient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  office_name: string;
  status: string | null;
  created_at: string;
  ai_familiarity_level: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  in_progress: { label: "Em Andamento", color: "bg-info/10 text-info border-info/20", icon: Clock },
  completed: { label: "Concluído", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

export function ClientsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ConsultingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Communication dialog
  const [commDialogOpen, setCommDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ConsultingClient | null>(null);
  const [commTab, setCommTab] = useState<"whatsapp" | "email">("whatsapp");
  const [message, setMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [user?.id]);

  const fetchClients = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consulting_clients')
        .select('id, full_name, email, phone, office_name, status, created_at, ai_familiarity_level')
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

  const handleDeleteClient = async (client: ConsultingClient) => {
    if (!confirm(`Tem certeza que deseja excluir ${client.full_name}?`)) return;
    
    try {
      const { error } = await supabase.functions.invoke("delete-consulting-client", {
        body: { email: client.email },
      });
      
      if (error) throw error;
      
      toast.success('Cliente excluído com sucesso');
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const openCommunicationDialog = (client: ConsultingClient, tab: "whatsapp" | "email") => {
    setSelectedClient(client);
    setCommTab(tab);
    setMessage('');
    setEmailSubject('');
    setCommDialogOpen(true);
  };

  const sendWhatsApp = async () => {
    if (!selectedClient || !message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("zapi-send-message", {
        body: {
          phone: selectedClient.phone,
          message: message.trim(),
        },
      });

      if (error) throw error;
      
      toast.success("Mensagem enviada!");
      setCommDialogOpen(false);
      setMessage('');
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const sendEmail = async () => {
    if (!selectedClient || !message.trim() || !emailSubject.trim()) {
      toast.error("Preencha o assunto e a mensagem");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-client-email", {
        body: {
          clientEmail: selectedClient.email,
          clientName: selectedClient.full_name,
          subject: emailSubject.trim(),
          content: message.trim(),
        },
      });

      if (error) throw error;
      
      toast.success("E-mail enviado!");
      setCommDialogOpen(false);
      setMessage('');
      setEmailSubject('');
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Erro ao enviar e-mail");
    } finally {
      setSending(false);
    }
  };

  const openWhatsAppDirect = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase()) ||
      (client.office_name && client.office_name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeClients = clients.filter(c => c.status === 'in_progress' || c.status === 'pending').length;
  const completedClients = clients.filter(c => c.status === 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes da Consultoria</h1>
          <p className="text-muted-foreground mt-1">Gestão e comunicação com clientes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeClients}</p>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedClients}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
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
                placeholder="Buscar por nome, e-mail ou escritório..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <Card className="glass border-border/50">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground">
              {clients.length === 0 
                ? "Os clientes aprovados na consultoria aparecerão aqui."
                : "Tente ajustar os filtros de busca."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => {
            const statusConfig = STATUS_CONFIG[client.status || 'pending'] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={client.id} className="glass border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">{client.full_name}</h3>
                        <Badge className={cn("border", statusConfig.color)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </span>
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </span>
                        )}
                        {client.office_name && client.office_name !== "Não informado" && (
                          <span className="truncate">📍 {client.office_name}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openWhatsAppDirect(client.phone)}
                        className="gap-1"
                        disabled={!client.phone}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCommunicationDialog(client, "email")}
                        className="gap-1"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="hidden sm:inline">E-mail</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/metodo-idea/consultoria/cliente/${client.id}`)}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/metodo-idea/consultoria/cliente/${client.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openCommunicationDialog(client, "whatsapp")}>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar via Sistema
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClient(client)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Communication Dialog */}
      <Dialog open={commDialogOpen} onOpenChange={setCommDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
            <DialogDescription>
              Enviando para {selectedClient?.full_name}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={commTab} onValueChange={(v) => setCommTab(v as "whatsapp" | "email")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whatsapp" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-2">
                <Mail className="w-4 h-4" />
                E-mail
              </TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="space-y-4 mt-4">
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={5}
                />
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 mt-4">
              <div>
                <Label>Assunto</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Assunto do e-mail"
                />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={5}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCommDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={commTab === "whatsapp" ? sendWhatsApp : sendEmail}
              disabled={sending}
            >
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {commTab === "whatsapp" ? "Enviar WhatsApp" : "Enviar E-mail"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
