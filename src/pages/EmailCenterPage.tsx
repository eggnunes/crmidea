import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Mail,
  Send,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Calendar,
  FileText,
  Loader2,
  Plus,
  ChevronDown,
  Eye,
  MailOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SentEmail {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  email_type: string;
  status: string;
  error_message: string | null;
  metadata: unknown;
  created_at: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'client' | 'lead';
  office_name?: string;
}

const emailTypeLabels: Record<string, string> = {
  client_communication: "Comunicação",
  welcome_email: "Boas-vindas",
  progress_report: "Relatório",
  diagnostic_notification: "Diagnóstico",
  booking_confirmation: "Agendamento",
  booking_reminder: "Lembrete",
  follow_up: "Follow-up",
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  sent: { label: "Enviado", icon: CheckCircle2, className: "text-green-600 bg-green-100" },
  pending: { label: "Pendente", icon: Clock, className: "text-yellow-600 bg-yellow-100" },
  failed: { label: "Falhou", icon: XCircle, className: "text-red-600 bg-red-100" },
};

export function EmailCenterPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRecipient, setFilterRecipient] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  
  // Compose email state
  const [showCompose, setShowCompose] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sending, setSending] = useState(false);
  
  // View email details
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [showEmailDetail, setShowEmailDetail] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch emails
      const { data: emailsData, error: emailsError } = await supabase
        .from('sent_emails_log')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (emailsError) throw emailsError;
      setEmails(emailsData || []);

      // Fetch consulting clients
      const { data: clientsData } = await supabase
        .from('consulting_clients')
        .select('id, full_name, email, office_name')
        .eq('user_id', user!.id)
        .order('full_name');

      // Fetch leads with email
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, name, email')
        .eq('user_id', user!.id)
        .not('email', 'is', null)
        .order('name');

      const allRecipients: Recipient[] = [
        ...(clientsData || []).map(c => ({
          id: c.id,
          name: c.full_name,
          email: c.email,
          type: 'client' as const,
          office_name: c.office_name
        })),
        ...(leadsData || []).filter(l => l.email).map(l => ({
          id: l.id,
          name: l.name,
          email: l.email!,
          type: 'lead' as const
        }))
      ];
      
      setRecipients(allRecipients);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedRecipient || !emailSubject.trim() || !emailContent.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const recipient = recipients.find(r => r.id === selectedRecipient);
    if (!recipient) {
      toast.error("Destinatário não encontrado");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-client-email", {
        body: {
          clientEmail: recipient.email,
          clientName: recipient.name,
          subject: emailSubject,
          content: emailContent
        }
      });

      if (error) throw error;

      toast.success(`Email enviado para ${recipient.name}`);
      setShowCompose(false);
      setSelectedRecipient("");
      setEmailSubject("");
      setEmailContent("");
      fetchData();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Erro ao enviar email');
    } finally {
      setSending(false);
    }
  };

  // Filter emails
  const filteredEmails = emails.filter(email => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !email.recipient_email?.toLowerCase().includes(search) &&
        !email.recipient_name?.toLowerCase().includes(search) &&
        !email.subject?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Type filter
    if (filterType !== "all" && email.email_type !== filterType) {
      return false;
    }

    // Status filter
    if (filterStatus !== "all" && email.status !== filterStatus) {
      return false;
    }

    // Recipient filter
    if (filterRecipient !== "all" && email.recipient_email !== filterRecipient) {
      return false;
    }

    // Date range filter
    if (dateRange !== "all") {
      const emailDate = new Date(email.created_at);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - emailDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateRange === "today" && diffDays > 0) return false;
      if (dateRange === "week" && diffDays > 7) return false;
      if (dateRange === "month" && diffDays > 30) return false;
    }

    return true;
  });

  // Stats
  const stats = {
    total: emails.length,
    sent: emails.filter(e => e.status === 'sent').length,
    failed: emails.filter(e => e.status === 'failed').length,
    today: emails.filter(e => {
      const emailDate = new Date(e.created_at);
      const now = new Date();
      return emailDate.toDateString() === now.toDateString();
    }).length,
    uniqueRecipients: new Set(emails.map(e => e.recipient_email)).size
  };

  // Get unique recipients from emails for filter
  const uniqueEmailRecipients = Array.from(
    new Set(emails.map(e => e.recipient_email))
  ).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="w-8 h-8 text-primary" />
            Central de Emails
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os emails enviados para leads e clientes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={showCompose} onOpenChange={setShowCompose}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Compor Email
                </DialogTitle>
                <DialogDescription>
                  Envie um email para um cliente ou lead
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Destinatário</Label>
                  <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um destinatário" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.filter(r => r.type === 'client').length > 0 && (
                        <>
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Clientes
                          </DropdownMenuLabel>
                          {recipients.filter(r => r.type === 'client').map(recipient => (
                            <SelectItem key={recipient.id} value={recipient.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                <span>{recipient.name}</span>
                                <span className="text-muted-foreground text-xs">
                                  ({recipient.email})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {recipients.filter(r => r.type === 'lead').length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Leads
                          </DropdownMenuLabel>
                          {recipients.filter(r => r.type === 'lead').map(recipient => (
                            <SelectItem key={recipient.id} value={recipient.id}>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-orange-500" />
                                <span>{recipient.name}</span>
                                <span className="text-muted-foreground text-xs">
                                  ({recipient.email})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input
                    placeholder="Assunto do email"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea
                    placeholder="Escreva sua mensagem..."
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    rows={10}
                    className="resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSendEmail} disabled={sending}>
                    {sending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Enviar Email
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Enviados</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Falhas</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Destinatários</p>
                <p className="text-2xl font-bold">{stats.uniqueRecipients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por destinatário, email ou assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(emailTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced filter for recipient */}
          <Collapsible className="mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronDown className="w-4 h-4" />
                Filtros avançados
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm mb-2 block">Filtrar por destinatário</Label>
                  <Select value={filterRecipient} onValueChange={setFilterRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um destinatário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os destinatários</SelectItem>
                      {uniqueEmailRecipients.map(email => (
                        <SelectItem key={email} value={email}>{email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Email List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Histórico de Emails ({filteredEmails.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmails.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MailOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum email encontrado</p>
              {searchTerm || filterType !== "all" || filterStatus !== "all" ? (
                <p className="text-sm mt-1">Tente ajustar os filtros</p>
              ) : (
                <Button 
                  variant="link" 
                  className="mt-2" 
                  onClick={() => setShowCompose(true)}
                >
                  Enviar primeiro email
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredEmails.map((email) => {
                  const status = statusConfig[email.status] || statusConfig.sent;
                  const StatusIcon = status.icon;
                  
                  return (
                    <div
                      key={email.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedEmail(email);
                        setShowEmailDetail(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={status.className}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                            <Badge variant="secondary">
                              {emailTypeLabels[email.email_type] || email.email_type}
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium truncate">{email.subject}</h4>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {email.recipient_name || 'Sem nome'}
                            </span>
                            <span className="truncate">{email.recipient_email}</span>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-muted-foreground shrink-0">
                          <p>{format(new Date(email.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                          <p>{format(new Date(email.created_at), "HH:mm", { locale: ptBR })}</p>
                        </div>
                      </div>
                      
                      {email.error_message && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                          Erro: {email.error_message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Email Detail Dialog */}
      <Dialog open={showEmailDetail} onOpenChange={setShowEmailDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes do Email
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Destinatário</Label>
                  <p className="font-medium">{selectedEmail.recipient_name || 'Sem nome'}</p>
                  <p className="text-sm text-muted-foreground">{selectedEmail.recipient_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Data de Envio</Label>
                  <p className="font-medium">
                    {format(new Date(selectedEmail.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    às {format(new Date(selectedEmail.created_at), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Badge variant="outline" className={statusConfig[selectedEmail.status]?.className}>
                  {statusConfig[selectedEmail.status]?.label || selectedEmail.status}
                </Badge>
                <Badge variant="secondary">
                  {emailTypeLabels[selectedEmail.email_type] || selectedEmail.email_type}
                </Badge>
              </div>

              <div>
                <Label className="text-muted-foreground text-sm">Assunto</Label>
                <p className="font-medium">{selectedEmail.subject}</p>
              </div>

              {selectedEmail.metadata && (
                <div>
                  <Label className="text-muted-foreground text-sm">Metadados</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto">
                    {JSON.stringify(selectedEmail.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEmail.error_message && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <Label className="text-red-600 text-sm">Mensagem de Erro</Label>
                  <p className="text-red-600">{selectedEmail.error_message}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const recipient = recipients.find(r => r.email === selectedEmail.recipient_email);
                    if (recipient) {
                      setSelectedRecipient(recipient.id);
                    }
                    setShowEmailDetail(false);
                    setShowCompose(true);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Novo Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
