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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  MessageSquare, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RefreshCw,
  Send,
  CalendarIcon,
  Trash2,
  Loader2,
  History,
  CalendarClock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useScheduledMessages, ScheduledMessage } from "@/hooks/useScheduledMessages";

interface ConsultingClient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  office_name: string;
}

interface WhatsAppMessage {
  id: string;
  phone: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  status: string;
  contact_name?: string;
}

export function ConsultingWhatsAppSystem() {
  const { user } = useAuth();
  const { messages: scheduledMessages, loading: scheduledLoading, scheduleMessage, cancelMessage, deleteMessage, refetch } = useScheduledMessages();
  const [clients, setClients] = useState<ConsultingClient[]>([]);
  const [messageHistory, setMessageHistory] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  
  // Schedule form
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleMessageText, setScheduleMessageText] = useState("");

  const fetchData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('consulting_clients')
        .select('id, full_name, email, phone, office_name')
        .eq('user_id', user.id)
        .order('full_name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Get client phones
      const clientPhones = clientsData?.map(c => c.phone) || [];
      
      // Fetch message history from whatsapp_conversations and messages
      if (clientPhones.length > 0) {
        const { data: conversationsData } = await supabase
          .from('whatsapp_conversations')
          .select('id, contact_phone, contact_name')
          .in('contact_phone', clientPhones);

        if (conversationsData && conversationsData.length > 0) {
          const conversationIds = conversationsData.map(c => c.id);
          
          const { data: messagesData } = await supabase
            .from('whatsapp_messages')
            .select('id, conversation_id, content, is_from_contact, created_at, status')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false })
            .limit(200);

          if (messagesData) {
            const formattedMessages: WhatsAppMessage[] = messagesData.map(m => {
              const conversation = conversationsData.find(c => c.id === m.conversation_id);
              return {
                id: m.id,
                phone: conversation?.contact_phone || '',
                content: m.content,
                direction: m.is_from_contact ? 'incoming' : 'outgoing',
                timestamp: m.created_at,
                status: m.status || 'sent',
                contact_name: conversation?.contact_name || clientsData?.find(c => c.phone === conversation?.contact_phone)?.full_name
              };
            });
            setMessageHistory(formattedMessages);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const handleSendMessage = async () => {
    if (!selectedClient || !messageText.trim()) {
      toast.error("Selecione um cliente e digite uma mensagem");
      return;
    }

    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("zapi-send-message", {
        body: {
          phone: client.phone,
          content: messageText
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success("Mensagem enviada via WhatsApp!");
        setMessageText("");
        fetchData();
      } else {
        throw new Error(data?.error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem. Verifique se o WhatsApp está conectado.");
    } finally {
      setSending(false);
    }
  };

  const handleScheduleMessage = async () => {
    if (!selectedClient || !scheduleMessageText.trim() || !scheduleDate || !scheduleTime) {
      toast.error("Preencha todos os campos para agendar");
      return;
    }

    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;

    const [hours, minutes] = scheduleTime.split(":").map(Number);
    const scheduledAt = new Date(scheduleDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    try {
      await scheduleMessage({
        contact_phone: client.phone,
        message: scheduleMessageText,
        scheduled_at: scheduledAt
      });
      
      setScheduleMessageText("");
      setScheduleDate(undefined);
      setScheduleTime("");
    } catch (error) {
      console.error("Error scheduling message:", error);
      toast.error("Erro ao agendar mensagem");
    }
  };

  const filteredMessages = messageHistory.filter(msg =>
    msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.phone.includes(searchTerm) ||
    msg.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter scheduled messages for consulting clients only
  const clientPhones = clients.map(c => c.phone);
  const consultingScheduledMessages = scheduledMessages.filter(m => 
    clientPhones.includes(m.contact_phone)
  );

  const getScheduledStatusBadge = (status: ScheduledMessage['status']) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Enviada
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Falhou
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelada
          </Badge>
        );
      default:
        return null;
    }
  };

  const getClientNameByPhone = (phone: string) => {
    return clients.find(c => c.phone === phone)?.full_name || phone;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="send" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Enviar
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4" />
              Agendadas
            </TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="icon" onClick={() => { fetchData(); refetch(); }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <TabsContent value="send" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Send Now */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Enviar Mensagem
                </CardTitle>
                <CardDescription>
                  Envie uma mensagem instantânea via WhatsApp
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
                          {client.full_name} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem *</Label>
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    rows={5}
                  />
                </div>

                <Button 
                  onClick={handleSendMessage} 
                  disabled={sending || !selectedClient || !messageText.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar via WhatsApp
                </Button>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5" />
                  Agendar Mensagem
                </CardTitle>
                <CardDescription>
                  Agende uma mensagem para envio automático
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
                          {client.full_name} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !scheduleDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduleDate ? format(scheduleDate, "dd/MM/yyyy") : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={scheduleDate}
                          onSelect={setScheduleDate}
                          disabled={(date) => date < new Date()}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Horário *</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem *</Label>
                  <Textarea
                    value={scheduleMessageText}
                    onChange={(e) => setScheduleMessageText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleScheduleMessage} 
                  disabled={!selectedClient || !scheduleMessageText.trim() || !scheduleDate || !scheduleTime}
                  className="w-full"
                  variant="outline"
                >
                  <CalendarClock className="w-4 h-4 mr-2" />
                  Agendar Mensagem
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Message History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Mensagens
              </CardTitle>
              <CardDescription>
                Mensagens enviadas e recebidas dos clientes da consultoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mensagem encontrada</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-4 border rounded-lg",
                          msg.direction === 'outgoing' 
                            ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" 
                            : "bg-muted/50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {msg.contact_name || msg.phone}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {msg.direction === 'outgoing' ? 'Enviada' : 'Recebida'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {msg.content}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(msg.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Mensagens Agendadas
              </CardTitle>
              <CardDescription>
                Mensagens programadas para envio automático
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : consultingScheduledMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mensagem agendada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultingScheduledMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getScheduledStatusBadge(msg.status)}
                          <span className="text-sm font-medium">
                            {getClientNameByPhone(msg.contact_phone)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {msg.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelMessage(msg.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMessage(msg.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {format(new Date(msg.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {msg.sent_at && (
                          <span>
                            Enviada: {format(new Date(msg.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      {msg.error_message && (
                        <p className="text-xs text-destructive mt-2">{msg.error_message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
