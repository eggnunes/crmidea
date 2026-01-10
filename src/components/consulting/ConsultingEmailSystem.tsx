import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RefreshCw,
  Send,
  Inbox,
  PenSquare,
  Users,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface SentEmail {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  email_type: string;
  status: string;
  error_message: string | null;
  metadata: unknown;
  created_at: string;
}

interface ConsultingClient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  office_name: string;
}

const emailTypeLabels: Record<string, string> = {
  'monthly_report': 'Relatório Mensal',
  'inactivity_reminder': 'Lembrete de Inatividade',
  'booking_confirmation': 'Confirmação de Agendamento',
  'booking_notification': 'Nova Reserva',
  'diagnostic_notification': 'Novo Diagnóstico',
  'welcome': 'Boas-vindas',
  'custom': 'Personalizado',
  'client_approved': 'Aprovação de Cliente',
  'client_signup': 'Cadastro de Cliente',
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  'sent': { label: 'Enviado', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  'pending': { label: 'Pendente', icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  'failed': { label: 'Falhou', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

export function ConsultingEmailSystem() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [clients, setClients] = useState<ConsultingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch emails
      const { data: emailsData, error: emailsError } = await supabase
        .from('sent_emails_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (emailsError) throw emailsError;
      setEmails(emailsData || []);

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('consulting_clients')
        .select('id, full_name, email, phone, office_name')
        .eq('user_id', user.id)
        .order('full_name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const handleSendEmail = async () => {
    if (!selectedClient || !emailSubject.trim() || !emailContent.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-client-email", {
        body: {
          clientEmail: client.email,
          clientName: client.full_name,
          subject: emailSubject,
          content: emailContent
        }
      });

      if (error) throw error;
      
      toast.success("E-mail enviado com sucesso!");
      setIsComposeOpen(false);
      setSelectedClient("");
      setEmailSubject("");
      setEmailContent("");
      fetchData();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Erro ao enviar e-mail");
    } finally {
      setSending(false);
    }
  };

  const filteredEmails = emails.filter(email =>
    email.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: emails.length,
    sent: emails.filter(e => e.status === 'sent').length,
    failed: emails.filter(e => e.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sent" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Enviados
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <PenSquare className="w-4 h-4" />
              Compor
            </TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <TabsContent value="sent" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, nome ou assunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Email List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Histórico de E-mails
              </CardTitle>
              <CardDescription>
                Todos os e-mails enviados para clientes da consultoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum e-mail encontrado</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredEmails.map((email) => {
                      const statusInfo = statusConfig[email.status] || statusConfig.sent;
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <div
                          key={email.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium truncate">
                                  {email.recipient_name || email.recipient_email}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {emailTypeLabels[email.email_type] || email.email_type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {email.subject}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Para: {email.recipient_email}
                              </p>
                              {email.error_message && (
                                <p className="text-xs text-red-500 mt-1">
                                  Erro: {email.error_message}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <Badge className={statusInfo.className}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(email.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenSquare className="w-5 h-5" />
                Compor E-mail
              </CardTitle>
              <CardDescription>
                Envie um e-mail personalizado para um cliente da consultoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Destinatário *</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name} - {client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assunto *</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Assunto do e-mail"
                />
              </div>

              <div className="space-y-2">
                <Label>Conteúdo *</Label>
                <Textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Conteúdo do e-mail..."
                  rows={10}
                />
              </div>

              <Button 
                onClick={handleSendEmail} 
                disabled={sending || !selectedClient || !emailSubject.trim() || !emailContent.trim()}
                className="w-full"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar E-mail
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
