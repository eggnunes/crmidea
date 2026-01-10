import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, 
  MessageCircle, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  ArrowDownUp
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SentEmail {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  email_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface WhatsAppMessage {
  id: string;
  content: string;
  is_from_contact: boolean;
  status: string;
  created_at: string;
  contact_phone: string;
  contact_name: string | null;
}

interface ClientCommunicationHistoryProps {
  clientEmail?: string;
  clientPhone?: string;
  clientId?: string;
  isAdminView?: boolean;
}

const emailStatusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  sent: { label: "Enviado", icon: <CheckCircle2 className="w-3 h-3" />, className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  failed: { label: "Falhou", icon: <XCircle className="w-3 h-3" />, className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  pending: { label: "Pendente", icon: <Clock className="w-3 h-3" />, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
};

const emailTypeLabels: Record<string, string> = {
  welcome: "Boas-vindas",
  custom: "Personalizado",
  notification: "Notificação",
  reminder: "Lembrete",
  report: "Relatório",
};

export function ClientCommunicationHistory({ 
  clientEmail, 
  clientPhone, 
  clientId,
  isAdminView = false 
}: ClientCommunicationHistoryProps) {
  const { user } = useAuth();
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user || clientEmail || clientPhone) {
      fetchCommunications();
    }
  }, [user, clientEmail, clientPhone]);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      // Fetch emails
      let emailQuery = supabase
        .from("sent_emails_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientEmail) {
        emailQuery = emailQuery.eq("recipient_email", clientEmail);
      } else if (user && isAdminView) {
        emailQuery = emailQuery.eq("user_id", user.id);
      }

      const { data: emailData, error: emailError } = await emailQuery;

      if (emailError) {
        console.error("Error fetching emails:", emailError);
      } else {
        setEmails(emailData || []);
      }

      // Fetch WhatsApp messages
      if (clientPhone || isAdminView) {
        // Normalize phone for searching
        const normalizedPhone = clientPhone?.replace(/\D/g, '');
        
        let messagesQuery = supabase
          .from("whatsapp_messages")
          .select(`
            id,
            content,
            is_from_contact,
            status,
            created_at,
            conversation:whatsapp_conversations!inner(
              contact_phone,
              contact_name
            )
          `)
          .order("created_at", { ascending: false });

        if (normalizedPhone) {
          messagesQuery = messagesQuery.ilike("whatsapp_conversations.contact_phone", `%${normalizedPhone}%`);
        } else if (user && isAdminView) {
          messagesQuery = messagesQuery.eq("user_id", user.id);
        }

        const { data: messagesData, error: messagesError } = await messagesQuery.limit(100);

        if (messagesError) {
          console.error("Error fetching WhatsApp messages:", messagesError);
        } else {
          const formattedMessages = (messagesData || []).map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            is_from_contact: msg.is_from_contact,
            status: msg.status,
            created_at: msg.created_at,
            contact_phone: msg.conversation?.contact_phone || "",
            contact_name: msg.conversation?.contact_name || null,
          }));
          setWhatsappMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error("Error fetching communications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(email =>
    email.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = whatsappMessages.filter(msg =>
    msg.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.contact_phone?.includes(searchTerm)
  );

  const emailStats = {
    total: emails.length,
    sent: emails.filter(e => e.status === "sent").length,
    failed: emails.filter(e => e.status === "failed").length,
  };

  const whatsappStats = {
    total: whatsappMessages.length,
    sent: whatsappMessages.filter(m => !m.is_from_contact).length,
    received: whatsappMessages.filter(m => m.is_from_contact).length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownUp className="w-5 h-5" />
          Histórico de Comunicações
        </CardTitle>
        <CardDescription>
          E-mails e mensagens de WhatsApp enviados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="emails" className="space-y-4">
          <TabsList>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="w-4 h-4" />
              E-mails ({emailStats.total})
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp ({whatsappStats.total})
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Emails Tab */}
          <TabsContent value="emails">
            {/* Email Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-lg font-bold">{emailStats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                <p className="text-lg font-bold text-green-600">{emailStats.sent}</p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
                <p className="text-lg font-bold text-red-600">{emailStats.failed}</p>
                <p className="text-xs text-muted-foreground">Falharam</p>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              {filteredEmails.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum e-mail encontrado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEmails.map((email) => (
                    <div key={email.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {emailTypeLabels[email.email_type] || email.email_type}
                            </Badge>
                            <Badge className={`text-xs gap-1 ${emailStatusConfig[email.status]?.className || ""}`}>
                              {emailStatusConfig[email.status]?.icon}
                              {emailStatusConfig[email.status]?.label || email.status}
                            </Badge>
                          </div>
                          <p className="font-medium mt-1 truncate">{email.subject}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            Para: {email.recipient_name || email.recipient_email}
                          </p>
                          {email.error_message && (
                            <p className="text-xs text-red-500 mt-1">{email.error_message}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(email.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp">
            {/* WhatsApp Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-lg font-bold">{whatsappStats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                <p className="text-lg font-bold text-green-600">{whatsappStats.sent}</p>
                <p className="text-xs text-muted-foreground">Enviadas</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                <p className="text-lg font-bold text-blue-600">{whatsappStats.received}</p>
                <p className="text-xs text-muted-foreground">Recebidas</p>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma mensagem encontrada.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-3 border rounded-lg ${
                        msg.is_from_contact 
                          ? "bg-muted/30 border-l-4 border-l-blue-400" 
                          : "border-l-4 border-l-green-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {msg.is_from_contact ? "Recebida" : "Enviada"}
                            </Badge>
                            {isAdminView && msg.contact_name && (
                              <span className="text-xs text-muted-foreground">
                                {msg.contact_name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-wrap line-clamp-3">
                            {msg.content}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(msg.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
